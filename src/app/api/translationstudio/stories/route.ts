import { NextResponse } from "next/server";
import Logger from "@/utils/Logger";
import { headers } from "next/headers";
import { GetSpaceAccessToens } from "@/app/GetSpaceInfo";

export interface StoryblokStory {
    "name": string;
    "created_at": string;
    "updated_at": string;
    "published_at": string;
    "id": number;
    "uuid": string;
    "published": boolean;
    "full_slug": string;
    "last_author"?: {
        "friendly_name": string;
    }
}

export async function GET()
{
    try
    {
        const headersList = await headers()
        const spaceid = headersList.get('X-spaceid') ?? "";
        const component = headersList.get('X-component') ?? "";
       
        const spaceToken = await GetSpaceAccessToens(spaceid);
        if (spaceToken.length === 0)
            return NextResponse.json({ message: "cannot obtain space token"}, { status: 400 }); 

        const url = `https://mapi.storyblok.com/v1/spaces/${spaceid}/stories?contain_component=${component}`;
        const res = await fetch(url, {
        headers: {
            "Authorization": "Bearer " + spaceToken[0],
            "Content-Type": "application/json"
            }
        });

        if (!res.ok)
            throw new Error("Cannot obtain components from " + url);

        const json = await res.json();
        if (json.stories?.length > 0)
        {
            const list:any = [];
            for (const e of json.stories)
            {
                if (e.content_type === component)
                    list.push(e);
            }

            return NextResponse.json(list);
        }            
        else
            return NextResponse.json([]);
    }
    catch (err:any)
    {
        Logger.error(err);
        return NextResponse.json({ message: err.message ?? "Could not get stories" }, { status: 500});
    }    
}