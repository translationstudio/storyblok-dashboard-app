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
import { Grid, Typography, CircularProgress } from '@mui/material';
const TSLOGO = "/logo/ts-logo-colored.svg";

export default function TranslationstudioLogo()
{
    return <Grid size={12} textAlign={"center"} style={{ paddingBottom: "4em"}}>
            <img className="translationstudiologo" src={TSLOGO} alt="" style={{ width: "100%", maxHeight: "100px", height: "100%"}}/>
        </Grid>
    
}

export function TranslationstudioLogoSmall()
{
    return <Grid size={12} textAlign={"center"} style={{ paddingBottom: "4em"}}>
            <img className="translationstudiologo" src={TSLOGO} alt="" style={{ width: "100%", maxHeight: "50px", height: "100%"}}/>
        </Grid>
    
}
export function TranslationstudioLoading(props: { text: string})
{
    return <Grid container rowGap={2}>
        <TranslationstudioLogo />
        <Grid size={12} textAlign={"center"}>
            <CircularProgress />
        </Grid>
        <Grid size={12} textAlign={"center"}> 
            <Typography component={"h2"}>{props.text}</Typography>
        </Grid>
    </Grid>
        
    
}