/*
Storyblok - translationstudio extension
Copyright (C) 2025 I-D Media GmbH, idmedia.com

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, see https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
*/
import StoryblokAppConfigration from "@/StoryblokAppConfiguration";
import { NextResponse } from "next/server";
import Logger from "@/utils/Logger";
import { headers } from "next/headers";
import { GetTranslationstudioLicense } from "@/app/GetTranslationstudioLicense";

const OPTIONS:any = process.env["NODE_ENV"] !== "production" ? { } : {
    secure: true,
    httpOnly: true,
    path: "/",
    sameSite: "strict"
    
}

export async function GET()
{
    try
    {
        const headersList = await headers()
        const spaceid = headersList.get('X-spaceid') ?? "";

        const license = await GetTranslationstudioLicense(headersList);
        if (!license)
            return NextResponse.json({ message: "Cannot obtain license"}, { status: 400 }); 

        const res = await fetch(StoryblokAppConfigration.URL + "/dashboard/authenticate", {
            method: "GET",
            cache: "no-cache",
            headers: {
                "X-license": license,
                "X-space": spaceid
            }
        });

        if (!res.ok)
        {
            const err = await res.json();
            return NextResponse.json(err, { status: 500 });
        }

        const json = await res.json();
        if (!json.token)
            throw new Error("Invalid");

        const response = new NextResponse(null, { status: 204});
        response.cookies.set("session", json.token, OPTIONS);

        return response;
    }
    catch (err:any)
    {
        Logger.warn(err.message ?? err);
        return NextResponse.json({ message: err.message ?? "Could not authorize"}, { status: 500 });
    }
}