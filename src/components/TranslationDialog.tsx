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
import { SendRounded } from "@mui/icons-material";
import { Grid, FormControlLabel, Checkbox, Button, Typography, useTheme, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import DueDatePicker from "./DueDatePicker";
import LanguageTargetCheckboxes from "./LanguageTargetCheckboxes";
import UrgentCheckbox from "./UrgentCheckbox";
import React from "react";
import { ConnectorMap, HomeProps, LanguageMap, Languages, SelectedStories, TranslationRequest, Translations } from "@/interfaces_types";
import dayjs from "dayjs";
import { NotifyMessage as NotifyMessageType } from '@/interfaces_types';
import useMediaQuery from '@mui/material/useMediaQuery';
import { NotifyMessage } from ".";

const RenderSelectionHeader = function (props: { count: number }) {
    if (props.count === 0)
        return <></>;

    const label = props.count === 1 ? "Story" : "Stories";
    return <Typography variant='h2'>Translate {props.count} {label}</Typography>
}


const getTranslations = (connectors: { [id: string]: boolean }, connectorMap: ConnectorMap) => {
    const trans: Translations[] = []

    Object.keys(connectors)
        .forEach((id) => {
            const connector = connectorMap[id];
            if (!connector)
                return;

            for (let lang of connector.targets) {
                trans.push({
                    source: connector.source,
                    target: lang,
                    "connector-project": connector.connector
                });
            }
        });

    return trans;
};


const GetValidLanguages = function(elem:Languages, available:string[])
{
	let removed = false;
	for (let n = elem.targets.length - 1; n >= 0; n--)
	{
		if (!available.includes(elem.targets[n]))
		{
			const l = elem.targets.splice(n, 1);
			console.warn("Removed invalid target language " + l);
			removed = true;
		}
	}

	return !removed;
}

const CreateConnectorMap = function (langs: Languages[], spaceLanguags:string[]) {
    
    const map: LanguageMap = {};
    const warnings: string[] = [];

    for (let elem of langs)
    {
        if (!GetValidLanguages(elem, spaceLanguags))
            warnings.push(elem.id);

        if (elem.targets.length > 0)
            map[elem.id] = elem;
    }

    return {
        map: map,
        warnings: warnings
    };
}


export default function TranslationDialog(props: HomeProps & { selectedStories: SelectedStories, spaceLanguages: string[], onClose: Function }) {

    if (Object.keys(props.selectedStories).length === 0)
        return <></>;

    const connectorMapData = CreateConnectorMap([...props.tsLanguageMappings], props.spaceLanguages);
    const connectorMap = connectorMapData.map;
    const connectorWarningIds = connectorMapData.warnings;

    const [notifyMessage, setNotifyMessage] = React.useState<NotifyMessageType | null>(null);
    const [enableSubmit, setEnableSubmit] = React.useState(false);
    const [receiveEmails, setReceiveEmails] = React.useState(typeof props.userInfo?.email === "string" && props.userInfo.email !== "");
    const [targetLanguageChecked, setTargetLanguageChecked] = React.useState<{ [id: string]: boolean }>({});
    const [ignoreNonAISettings, setIgnoreNonAISettings] = React.useState(true);
    const [urgent, setUrgent] = React.useState(true);
    const [dueDate, setDueDate] = React.useState<number | undefined>();
    const [pending, setPending] = React.useState(false);

    const handleUrgentChange = (event: React.ChangeEvent<HTMLInputElement>) => setUrgent(event.target.checked);

    const handleDueDateChange = (dueDate: dayjs.Dayjs | null) => {
        const time = dayjs(dueDate).unix();
        setDueDate(time > Date.now() ? time : undefined)
    }


    const handleTargetChange = (id: string, checked: boolean) => {
        if (!id)
            return;

        if (checked)
            targetLanguageChecked[id] = true;
        else if (targetLanguageChecked[id])
            delete targetLanguageChecked[id];

        let hasNonAi = false;
        for (let key in targetLanguageChecked) {
            if (connectorMap[key] && targetLanguageChecked[key] && !connectorMap[key].machine) {
                hasNonAi = true;
                break;
            }
        }

        const hasSelection = Object.keys(targetLanguageChecked).length > 0;

        setEnableSubmit(hasSelection);
        setTargetLanguageChecked({ ...targetLanguageChecked });

        if (!hasNonAi) {
            setUrgent(true);
            setDueDate(undefined);
            setIgnoreNonAISettings(true);
        }
        else
            setIgnoreNonAISettings(false);
    };
    const handleSubmit = () => {
        setNotifyMessage({ type: 'info', withIcon: true, message: "Sending translation request..." });
        setEnableSubmit(false);
        setPending(true);
        const list: any = [];
        for (const id in props.selectedStories)
            list.push({ uid: id, title: props.selectedStories[id] });

        const payload: TranslationRequest = {
            entries: list, // UID of the entry
            email: (props.userInfo.email ?? ""), // user email
            spaceid: props.spaceId,
            urgent: urgent,
            duedate: dueDate ?? 0,
            notifyUser: ignoreNonAISettings === false && receiveEmails,
            translations: getTranslations(targetLanguageChecked, connectorMap)
        };

        fetch("/api/translationstudio/translate", {
            method: "POST",
            headers: {
                "X-translationstudio": "storyblok",
                "X-spaceid": props.spaceId,
            },
            body: JSON.stringify(payload),
        })
            .then((res) => {
                if (!res.ok)
                    throw new Error("Could not submit request");

                setNotifyMessage({ type: 'success', withIcon: true, message: "Translation request sent successfully!" });
            })
            .catch(err => {
                console.error(err);
                setNotifyMessage({ type: 'error', withIcon: true, message: "Could not submit request" });
            })
            .finally(() => {
                setEnableSubmit(true);
                setPending(false);
            });
    };

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    return <Dialog fullScreen={fullScreen} open={true} scroll={"paper"}>
        <DialogTitle>
            <RenderSelectionHeader count={Object.keys(props.selectedStories).length} />
        </DialogTitle>
        <DialogContent>
            <Grid container rowGap={1}>
                {notifyMessage?.message ? <>
                    <Grid size={12}>
                        <NotifyMessage notifyMessage={notifyMessage} />
                    </Grid>
                    </> : <>
                    <Grid size={12}>
                        <LanguageTargetCheckboxes handleTargetChange={handleTargetChange}
                            tsLanguageMappings={props.tsLanguageMappings}
                            targetLanguageChecked={targetLanguageChecked}
                            invalidIds={connectorWarningIds}
                        />
                    </Grid>
                    <Grid size={12}>
                        <DueDatePicker handleDueDateChange={handleDueDateChange} isMachineTranslation={ignoreNonAISettings} dueDate={dueDate} />
                    </Grid>
                    <Grid size={12}>
                        <UrgentCheckbox handleUrgentChange={handleUrgentChange} isMachineTranslation={ignoreNonAISettings} urgent={urgent} />
                    </Grid>
                    <Grid size={12}>
                        <FormControlLabel
                            control={<Checkbox onChange={(event: React.ChangeEvent<HTMLInputElement>) => setReceiveEmails(event.target.checked)}
                                checked={receiveEmails && !ignoreNonAISettings && (props.userInfo?.email ?? "") !== ""}
                                inputProps={{ 'aria-label': 'controlled' }} 
                                disabled={ignoreNonAISettings || (props.userInfo?.email ?? "") === ""}
                                />}
                            label="Receive e-mail notifications"
                        />
                    </Grid>
                </>}
            </Grid>
        </DialogContent>
        {notifyMessage?.message ? <DialogActions>
            <Button variant="contained" size="small" onClick={() => props.onClose()} disabled={pending}>
                OK
            </Button>
        </DialogActions> :
         <DialogActions>
            <Button variant="outlined" size="small" onClick={() => props.onClose()} disabled={pending}>
                Cancel
            </Button>
            <Button disabled={!enableSubmit || pending} onClick={() => handleSubmit()} startIcon={<SendRounded />} type="button" variant="contained" size="small">
                {urgent ? "Translate immediately" : "Translate"}
            </Button>
        </DialogActions>}
    </Dialog>
}