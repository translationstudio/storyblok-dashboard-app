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
import React from "react";
import { Languages } from '@/interfaces_types';
import { Alert, Box, Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, Typography } from '@mui/material'


type LanguageTargetCheckboxesProps = {
    handleTargetChange: (id:string, checked:boolean) => void;
    tsLanguageMappings: Languages[];
    targetLanguageChecked: { [key: string]: boolean };
    invalidIds: string[]
}

const GetConnectorLabel = function(item:Languages, invalidIds:string[], invalidNames:string[])
{
    if (invalidIds.length === 0 || !invalidIds.includes(item.id))
        return item.name;

    return item.name + "*";
}

const LanguageTargetCheckboxes = ({ handleTargetChange, tsLanguageMappings, targetLanguageChecked, invalidIds }: LanguageTargetCheckboxesProps) => {
    if (tsLanguageMappings.length === 0) {
        return <></>
    }

    let showInvalidInformation = false;

    return <Box component="section">
        <FormControl>
            <FormLabel id="checkbox-buttons-target-language-group-label">
                <Typography variant="overline">Translate using</Typography>
            </FormLabel>
            <Box sx={{ pl: 1 }}>
                <FormGroup>
                    {tsLanguageMappings.map((item, idx) => {
                        
                        const hasInvalids = invalidIds.length > 0 && invalidIds.includes(item.id);
                        if (hasInvalids)
                            showInvalidInformation = true;

                        return <FormControlLabel 
                            key={"target-language-option-" + idx} 
                            name={idx.toString()} 
                            label={item.name + (hasInvalids ? "*": "")} 
                            control={
                                <Checkbox checked={targetLanguageChecked[item.id] === true}
                                    onChange={(e) => handleTargetChange(item.id, e.target.checked)} 
                                    inputProps={{ 'aria-label': 'controlled' }} 
                                />
                            } />
                    })}
                </FormGroup>
                {showInvalidInformation && (<Alert severity="warning">Some invalid target languages were found and removed automatically.</Alert>)}
            </Box>
        </FormControl>
    </Box>
}

export default LanguageTargetCheckboxes;
