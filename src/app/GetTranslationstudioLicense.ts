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
import { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
import { headers } from "next/headers";
import GetAppInformation from "./GetAppInformation";
import { GetSpaceAccessToen, GetSpaceInfo } from "./GetSpaceInfo";

export async function GetTranslationstudioLicense(headersList: ReadonlyHeaders|null)
{
    if (headersList === null)
        headersList = await headers()

    const spaceid = headersList.get('X-spaceid') ?? "";
    const spaceToken = await GetSpaceAccessToen(spaceid);
    if (!spaceToken)
        throw new Error("Cannot obtain space token");

    const space = await GetSpaceInfo(spaceToken);
    if (!space)
        throw new Error("cannot obtain space info");

    const appInfo = await GetAppInformation(spaceid, space.ownerAccessToken);
    if (appInfo?.license)
        return appInfo.license;

    return "";
}