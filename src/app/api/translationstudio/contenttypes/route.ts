import { NextResponse } from "next/server";
import Logger from "@/utils/Logger";
import { headers } from "next/headers";
import { GetSpaceAccessToens } from "@/app/GetSpaceInfo";


const hasTranslatableSchema = function(data:any, map:any)
{
    if (data.name && map[data.name])
        return map[data.name] === true;

    if (typeof data !== "object")
        return false;

    if (data.translatable === true)
        return true;

    if (data.type === "bloks")
    {
        if (!data.component_whitelist || !Array.isArray(data.component_whitelist) || data.component_whitelist.length === 0)
            return true;

        for (const elem of data.component_whitelist)
        {
            if (typeof map[elem] !== "undefined")
                return map[elem] === true;
        }
    }

    const keys = Object.keys(data);
    if (keys.length === 0)
        return false;

    for (const key of keys)
    {
        if (hasTranslatableSchema(data[key], map))
            return true;
    }

    return false;
}

export async function GET()
{
    try
    {
        const headersList = await headers()
        const spaceid = headersList.get('X-spaceid') ?? "";
       
        const spaceToken = await GetSpaceAccessToens(spaceid);
        if (spaceToken.length === 0)
            return NextResponse.json({ message: "cannot obtain space token"}, { status: 400 }); 

        const res = await fetch(`https://mapi.storyblok.com/v1/spaces/${spaceid}/components`, {
        headers: {
            "Authorization": "Bearer " + spaceToken[0],
            "Content-Type": "application/json"
            }
        });

        if (!res.ok)
            throw new Error("Cannot obtain components");

        const json = await res.json();
        const groups:any = { };

        groups["x_root"] = {
            name: "",
            list: []
        }
        if (json.component_groups?.length > 0)
        {
            for (const elem of json.component_groups)
            {
                groups[elem.uuid] = {
                    name: elem.name,
                    list: []
                };
            }
        }

        if (json.components?.length > 0)
        {
            const known:any = { }
            const map:any = { }
            for (const elem of json.components)
            {
                const has = hasTranslatableSchema(elem.schema, map);
                if (elem.name)
                    map[elem.name] = has;
                
                if (!has)
                    continue;

                const gid = elem.component_group_uuid ? elem.component_group_uuid : "x_root";
                if (groups[gid])
                {
                    known["" + elem.id] = true;
                    groups[gid].list.push({id: elem.id, name: elem.name });
                }

            }

            for (const elem of json.components)
            {
                if (known["" + elem.id] || !hasTranslatableSchema(elem.schema, map))
                    continue;

                const gid = elem.component_group_uuid ? elem.component_group_uuid : "x_root";
                if (groups[gid])
                    groups[gid].list.push({id: elem.id, name: elem.name });
            }
        }

        const list:any = [];
        for (const key in groups)
        {
            if (groups[key].list.length > 0)
                list.push(groups[key]);
        }
        
        return NextResponse.json(list);
    }
    catch (err:any)
    {
        Logger.error(err);
        return NextResponse.json({ message: err.message ?? "Could not get data" }, { status: 500});
    }    
}