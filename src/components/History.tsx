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

import { FilterType, HistoryEntry, HistoryUuidMap, HistoryUuidMapEntry, SortableHistoryEntry } from "@/interfaces_types";
import { Chip, Grid, Paper, Stack, styled, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import React from "react";

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

const dateToString = function(num:number)
{
    if (num === 0)
        return "";

    return new Date(num).toLocaleString();
}

const timeImportedIsMostRecent = function(item:HistoryEntry)
{
    return item['time-imported'] >= item['time-intranslation'] 
        && item['time-imported'] >= item['time-requested'];
}

const timeInTranslationIsMostRecent = function(item:HistoryEntry)
{
    return item['time-intranslation'] >= item['time-imported'] 
        && item['time-intranslation'] >= item['time-requested'];
}

const hasTimeExported = function(item:HistoryEntry)
{
    return item['time-requested'] > 0;
}


type TranslationStatus = {
    time: number;
    type: string;
    category: FilterType;
}

const identfyStatus = function(item:HistoryEntry)
{
    const res:TranslationStatus = {
        time: item['time-updated'],
        type: "last updated on",
        category: "none"
    };

    if (timeImportedIsMostRecent(item))
    {
        res.time = item['time-imported'];
        res.type = "translation imported on";
        res.category = "imported";
    }
    else if (timeInTranslationIsMostRecent(item))
    {
        res.time = item['time-intranslation'];
        res.type = "in translation since";
        res.category = "intranslation";
    }
    else if (hasTimeExported(item))
    {
        res.time = item['time-requested'];
        res.type = "queued for translation on";
        res.category = "queued";
    }

    return res;
} 


export function createHistoryUuidMap(list:SortableHistoryEntry[])
{
    const res:HistoryUuidMap = { };
    list.forEach(elem =>{

        const entry:HistoryUuidMapEntry = {
            lang: elem.element["target-language"],
            status: elem.status,
            date: elem.date,
            time: elem.time
        }

        if (res[elem.element["element-uid"]])
            res[elem.element["element-uid"]].push(entry);
        else 
            res[elem.element["element-uid"]] = [entry];
    }); 
    return res;
}

const calculateHistorySortable = function(list:HistoryEntry[])
{
    const res:SortableHistoryEntry[] = [];
    for (const item of list)
    {
        const status = identfyStatus(item);								                            
        const date = dateToString(status.time);

        res.push({
            date: date,
            element: item,
            language: item["target-language"],
            name: item["element-name"],
            time: status.time,
            status: status.category,
            visible: true
        })
    }

    return res;
}

type FilterEntry = {
    [type: string] : boolean
}

type FilterCount = {
    [type: string] : number
}

const getFilterLabel = function(key:string)
{
    switch(key as FilterType)
    {
        case "imported":
            return "translated"
        case "intranslation":
            return "in translation"
        case "queued":
        default:
            return "Queued";
    }
}

export function prepareHistoryMap(list:HistoryEntry[])
{
    return calculateHistorySortable(list);
}

export default function History(props: { list: SortableHistoryEntry[] }) {

    if (props.list.length === 0) {
        return <Grid size={12} style={{ paddingTop: "2em"}}>
            <Stack direction="column" spacing={4} sx={{ justifyContent: "center", alignItems: "center", marginTop: "3em" }}>
                <FolderOpenIcon />
                <Typography variant='button'>There is no history information available, yet.</Typography>
                <Typography variant='subtitle1'>Start using translationstudio and your space's history will show up here.</Typography>
            </Stack>
        </Grid>
    }

    const [history, setHistory] = React.useState<SortableHistoryEntry[]>(props.list);
    const [filter, setFilter] = React.useState<FilterEntry>({ });
    const [filterCount, setFilterCount] = React.useState<FilterCount>({ });

    React.useEffect(() => {
        const fMap:any = { };
        const fCount:FilterCount = { };

        props.list.forEach(e => { fMap[e.status] = false; 
            if (!fCount[e.status])
                fCount[e.status] = 1;
            else 
                fCount[e.status]++;
        });
        setFilter(fMap);
        setFilterCount(fCount);
    }, [setHistory, setFilter])

    const toggleFilter = function(key:string)
    {
        filter[key] = !filter[key];
        setFilter({ ...filter });

        let hasAnyFiltere = false;
        for (const key in filter)
            hasAnyFiltere = hasAnyFiltere || filter[key] === true;

        for (const item of history)
            item.visible = !hasAnyFiltere || filter[item.status] === true

        setHistory([...history]);
    }

    const RenderFilterList = function()
    {
        return <Grid size={12} style={{ paddingBottom: "1em"}} >{
            Object.keys(filter).map((key) => {
                const color = filter[key] ? "filled": "outlined";
                return (<Chip
                    label={getFilterLabel(key) + " (" + (filterCount[key] ?? 1) + ")"}
                    key={key}
                    variant={color} 
                    color="primary"
                    onClick={() => toggleFilter(key)}
                    style={{ marginRight: "0.5em"}}
                />) 
            })
        }
        </Grid>
    }

    return <Grid container size={12} style={{ paddingTop: "2em"}}>
        
        <RenderFilterList />

        <TableContainer component={Paper}>
            <Table sx={{ width: "100%" }} size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Target</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Updated at</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {history.filter(i => i.visible).map((item,idx) => {
                        return <StyledTableRow key={"e"+idx} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell component="th" scope="row">
                                <Typography variant='subtitle1'>{item.name}</Typography>
                            </TableCell>
                            <TableCell>
                                {item.language}
                            </TableCell>
                            <TableCell>
                                {getFilterLabel(item.status)}
                            </TableCell>
                            <TableCell>
                                {item.date}
                            </TableCell>
                        </StyledTableRow>
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    </Grid>
}
