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
export { getServerSideProps } from '@/utils/serverSideProps';

import Head from 'next/head';
import { useRouter } from 'next/navigation'

import { HistoryEntry, HistoryUuidMap, HomeProps, NotifyMessage as NotifyMessageType, SelectedStories, SortableHistoryEntry } from '@/interfaces_types';

import { NotifyMessage } from "@/components"

import { Avatar, Backdrop, Breadcrumbs, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, Grid, IconButton, Stack, styled, Tab, Tabs, Tooltip, Typography } from '@mui/material'
import TranslateIcon from '@mui/icons-material/Translate';
import SettingsIcon from '@mui/icons-material/Settings';
import WidgetsIcon from '@mui/icons-material/Widgets';

import TranslationstudioLogo, { TranslationstudioLoading } from '@/utils/Logo';
import React from 'react';
import { StoryblokStory } from '@/app/api/translationstudio/stories/route';

import HistoryIcon from '@mui/icons-material/History';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import History, { createHistoryUuidMap, prepareHistoryMap } from "@/components/History"
import TranslationDialog from '@/components/TranslationDialog';
import { Launch } from '@mui/icons-material';

interface ConentTypeGroup {
	name: string;
	list: {
		id: number;
		name: string;
	}[]
}

const StyledTableRow = styled(TableRow)(({ theme }) => ({
	'&:hover': {
		backgroundColor: theme.palette.action.hover,
	},
	// hide last border
	'&:last-child td, &:last-child th': {
		border: 0,
	},
}));

const RenderBackdrop = function (props: { pending: boolean }) {
	return <Backdrop
		sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
		open={props.pending}
	>
		<CircularProgress color="inherit" />
	</Backdrop>
}

const RenderSelectContentType = function () {
	return <div className='text-center introduction'>
		<Typography>Please select a content type first</Typography>
	</div>
}

type MessageDialogType = {
	confirm?: boolean;
	title: string;
	text: string;
	callback?: Function
}

const RenderMessageBox = function (props: { data: MessageDialogType, onClose: Function }) {
	const fnCallback = function () {
		if (props.data.callback)
			props.data.callback();

		props.onClose();
	}
	return <Dialog
		open={true}
	>
		<DialogTitle>{props.data.title}</DialogTitle>
		<DialogContent>
			<DialogContentText>{props.data.text}</DialogContentText>
		</DialogContent>
		<DialogActions>
			<Button variant="outlined" onClick={() => props.onClose()}>Cancel</Button>
			<Button onClick={() => fnCallback()}>OK</Button>
		</DialogActions>
	</Dialog>
}

const convertDateFormat = function (date: string) {
	const parts = date.split("-");
	if (parts.length !== 3)
		return date;

	return parts[2] + "/" + parts[1] + "/" + (parts[0].length === 4 ? parts[0].substring(2) : parts[0]);
}

const convertDateTIme = function (time: string) {
	const parts = time.split(":");
	if (parts.length !== 3)
		return time;

	let n = parseInt(parts[0]);
	const format = n >= 12 ? "PM" : "AM";
	if (n > 12)
		n -= 12

	const r = n < 10 ? "0" : "";
	return r + n + "/" + parts[1] + " " + format;
}

const getInitials = function (name: string) {
	if (name === "")
		return "";

	const val = name.length > 1 ? name.substring(0, 2) : name.substring(0, 1)
	return val.toUpperCase();
}

const prettyPrintNam = function (name: string) {
	return name;
}

const processStories = function (list: StoryblokStory[]) {
	list.filter(e => e.updated_at && e.updated_at.includes("T")).forEach(e => {
		const pos = e.updated_at.lastIndexOf('.');
		if (pos > 0)
			e.updated_at = e.updated_at.substring(0, pos);

		const parts = e.updated_at.split("T");
		if (parts.length !== 2)
			return;

		e.updated_at = convertDateFormat(parts[0]) + " " + convertDateTIme(parts[1]);
	});
	return list;
}

function RenderNotConfiured() {
	return <>
		<Head>
			<title>translationstudio</title>
			<meta name="viewport" content="width=device-width, initial-scale=1" />
		</Head>
		<main style={{ padding: "2em" }}></main>
		<Grid container rowGap={2} columnGap={2}>
			<TranslationstudioLogo />
			<Grid size={2} />
			<Grid size={8}>
				<NotifyMessage notifyMessage={{
					type: 'warning',
					withIcon: true,
					message: "You do not yet have any translation settings configured. Please access your translationstudio account and configure your Storyblok integration."
				}} />
			</Grid>
			<Grid size={2} />
		</Grid>
	</>
}
const RenderPath = function (props: { folder: string, type: string }) {
	return <Breadcrumbs aria-label="breadcrumb" separator="›" className='breadcrmb' style={{ marginBottom: "2em" }}>
		<Typography sx={{ color: 'text.primary' }}>
			Select stories to translate from
		</Typography>
		{props.type &&
			<Typography>
				{props.folder ? props.folder : "."}
			</Typography>
		}
		<Typography sx={{ color: 'text.primary' }}>
			{props.type}
		</Typography>

	</Breadcrumbs>
}

const getTranslationLabel = function (key: string) {
	switch (key) {
		case "imported":
			return "translated"
		case "intranslation":
			return "in translation"
		case "queued":
		default:
			return "Queued";
	}
}

const RenderHistoryInformation = function (props: { entry: StoryblokStory, map: HistoryUuidMap }) {
	const data = props.map[props.entry.id];
	if (!data)
		return <>-</>

	return <>{data.map((elem, idx) => <React.Fragment key={"h" + props.entry.uuid + "-" + idx}>
		<Typography variant='subtitle1'>{elem.lang}: {getTranslationLabel(elem.status)}</Typography>
		<Typography variant='caption'>{elem.date}</Typography>
	</React.Fragment>)}
	</>
}

function getSpaceLangaugs(languages: any[]) {
	if (!languages || !Array.isArray(languages) || languages.length === 0) {
		console.warn("Cannot identify space languags");
		return [];
	}

	const res: string[] = [];
	for (const e of languages)
		res.push(e.code);

	return res.sort();
}

export default function Home(props: HomeProps) {
	if (props.tsLanguageMappings.length === 0) {
		<RenderNotConfiured />
	}

	const { push } = useRouter();

	const spaceId = props.spaceId;

	const spaceLanguags = getSpaceLangaugs(props.space?.languages ?? []);
	const [notifyMessage, setNotifyMessage] = React.useState<NotifyMessageType | null>(null);
	const [contentTypes, setContentTypes] = React.useState<ConentTypeGroup[]>([]);
	const [currentType, setCurrentType] = React.useState(-1);
	const [currentFolder, setCurrentFolder] = React.useState<{ folder: string, tpl: string }>({ folder: "", tpl: "" });
	const [currentStories, setCurrentStories] = React.useState<StoryblokStory[]>([])
	const [selectedStories, setSelectedStories] = React.useState<SelectedStories>({});
	const [loader, setLoader] = React.useState(true);
	const [pending, setPending] = React.useState(false);
	const [messageDialog, setMessageDialog] = React.useState<MessageDialogType | null>(null);
	const [currentTab, setCurrentTab] = React.useState(0);
	const [history, setHistory] = React.useState<SortableHistoryEntry[]>([]);
	const [historyMap, setHistoryMap] = React.useState<HistoryUuidMap>({});
	const [openTranslationDialog, setOpenTranslationDialog] = React.useState(false);
	const [filterContentType, setFilterContentType] = React.useState("")

	const handleSettings = () => {
		setLoader(true);
		push('/configuration?spaceId=' + props.spaceId + '&userId=' + props.userId);
	}

	const loadContentTypes = function () {
		if (contentTypes.length > 0)
			return;

		setPending(true);
		fetch("/api/translationstudio/contenttypes", {
			headers: {
				"X-spaceid": props.spaceId,
				"X-translationstudio": "storyblok"
			},

		})
			.then(res => {
				if (!res.ok)
					throw new Error("Could not load content types");

				return res.json();
			})
			.then((types: ConentTypeGroup[]) => {
				if (types.length > 0) {
					for (const e of types)
						e.list.sort((a, b) => a.name.localeCompare(b.name))

					setContentTypes(types.sort((a: ConentTypeGroup, b: ConentTypeGroup) => a.name.localeCompare(b.name)));
				}
				else
					setNotifyMessage({ type: 'info', message: "No content types available" });
			})
			.catch(err => setNotifyMessage({ type: 'error', message: err.message ?? "Could not load content types" }))
			.finally(() => setPending(false));
	}

	const loadHistory = function (usePending = true) {
		if (usePending)
			setPending(true);

		fetch("/api/translationstudio/history", {
			headers: {
				"X-spaceid": props.spaceId,
				"X-translationstudio": "storyblok",
			}
		})
			.then((res) => {
				if (res.ok)
					return res.json();

				throw new Error("Cannot load history");
			})
			.then((list: HistoryEntry[]) => {
				const sortabl = prepareHistoryMap(list);
				const map = createHistoryUuidMap(sortabl);
				setHistory(sortabl);
				setHistoryMap(map);
			})
			.catch((err) => {
				console.error(err);
				setNotifyMessage({ type: 'error', message: err.message ?? "Could not load content types" })
			}).finally(() => {
				if (usePending)
					setPending(false)
				else
					setLoader(false);
			})
	}

	React.useEffect(() => {

		loadHistory(false);

	}, [setHistory, setLoader]);

	const doLoadStoriesByType = function (type: number, tpl: string, folder: string) {
		setNotifyMessage(null);
		setPending(true);
		fetch("/api/translationstudio/stories", {
			headers: {
				"X-spaceid": props.spaceId,
				"X-translationstudio": "storyblok",
				"X-component": "" + tpl
			}
		})
			.then((res) => {
				if (res.ok)
					return res.json();

				throw new Error("Cannot load stories of type " + tpl);
			})
			.then((list: StoryblokStory[]) => {
				setSelectedStories({});
				setCurrentStories(processStories(list));
				setCurrentType(type);
				setCurrentFolder({ folder: folder, tpl: tpl });
			})
			.catch((err) => {
				console.error(err);
				setNotifyMessage({ type: 'error', message: err.message ?? "Could not load content types" })
			}).finally(() => setPending(false))
	}

	const loadStoriesByType = function (type: number, tpl: string, folder: string) {
		if (Object.keys(selectedStories).length === 0) {
			doLoadStoriesByType(type, tpl, folder);
			return;
		}

		setMessageDialog({
			confirm: true,
			title: "Your selection will be lost",
			text: "You have selected stories. If you proceed, this selection will be lost",
			callback: () => doLoadStoriesByType(type, tpl, folder)
		});
	}

	if (loader || !spaceId) {
		return <main style={{ padding: "2em" }}>
			<TranslationstudioLoading text="Loading Storyblok content types" />
		</main>
	}

	const RenderTranslateButton = function () {
		const len = Object.keys(selectedStories).length;
		if (len === 0)
			return <></>;

		const label = len === 1 ? "Story" : "Stories";
		return <Fab color="primary" aria-label="translate" variant="extended" onClick={() => setOpenTranslationDialog(true)} style={{ position: "fixed", right: "2em", bottom: "2em", zIndex: "2"}}>
			<TranslateIcon /> Translate {len} {label}
		</Fab>
	}

	const RenderStories = function () {

		if (currentStories.length === 0) {
			return <Stack direction="column" spacing={4} sx={{ justifyContent: "center", alignItems: "center", marginTop: "3em" }}>
				<FolderOpenIcon />
				<Typography variant='button'>No stories available.</Typography>
				<Typography variant='subtitle1'>This content type doesn't have any content yet.</Typography>
			</Stack>
		}

		return <>
			<TableContainer component={Paper} style={{ paddingTop: "1em" }}>
				<Table sx={{ width: "100%" }} size="small">
					<TableHead>
						<TableRow>
							<TableCell>
								<Checkbox
									color="primary"
									checked={Object.keys(selectedStories).length === currentStories.length && currentStories.length > 0}
									onChange={(e) => {
										if (!e.target.checked) {
											setSelectedStories({})
											return;
										}

										for (const story of currentStories)
											selectedStories["" + story.id] = story.name;

										setSelectedStories({ ...selectedStories })
									}}
								/>
							</TableCell>
							<TableCell>Name</TableCell>
							<TableCell />
							<TableCell>Updated at</TableCell>
							<TableCell>by</TableCell>
							<TableCell>Translation Status</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{currentStories.map((row) => (
							<StyledTableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
								<TableCell>
									<Checkbox
										color="primary"
										checked={selectedStories["" + row.id] !== undefined}
										onChange={(e) => {
											if (e.target.checked)
												selectedStories["" + row.id] = row.name;
											else if (selectedStories["" + row.id])
												delete selectedStories["" + row.id];

											setSelectedStories({ ...selectedStories })
										}}
									/>
								</TableCell>
								<TableCell component="th" scope="row" onClick={() => { 
										if (selectedStories["" + row.id])
											delete selectedStories["" + row.id];
										else
											selectedStories["" + row.id] = row.name;

										setSelectedStories({ ...selectedStories })
								}} style={{ cursor: "pointer"}}>
									<Typography variant='subtitle1'><b>{row.name}</b></Typography>
									<Typography variant='caption'>{row.full_slug ?? ""}</Typography>
								</TableCell>
								<TableCell>
									<a href={"https://app.storyblok.com/#/me/spaces/" + spaceId + "/stories/0/0/" + row.id} target='_blank'>
										<Launch />
									</a>
								</TableCell>
								<TableCell>
									<Typography variant='subtitle1'>{row.updated_at ?? "-"}</Typography>
									<Typography variant='caption'>{row.last_author?.friendly_name ?? ""}</Typography>
								</TableCell>
								<TableCell>
									<Tooltip title={row.last_author?.friendly_name ?? ""} placement="top">
										<Avatar style={{ marginRight: "10px", textAlign: "center", fontSize: "0.9em" }}>{getInitials(row.last_author?.friendly_name ?? "")}</Avatar>
									</Tooltip>
								</TableCell>
								<TableCell>
									<RenderHistoryInformation entry={row} map={historyMap} />
								</TableCell>
							</StyledTableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</>
	}

	return (
		<>
			<Head>
				<title>translationstudio</title>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
			</Head>
			<main style={{ padding: "2em" }}>
				<RenderBackdrop pending={pending} />
				{messageDialog && <RenderMessageBox data={messageDialog} onClose={() => setMessageDialog(null)} />}
				{openTranslationDialog && <TranslationDialog {...props} spaceLanguages={spaceLanguags} selectedStories={selectedStories} onClose={() => setOpenTranslationDialog(false)} />}

				<Grid container rowGap={0} columnGap={2}>
					<TranslationstudioLogo />

					<Grid size={12} className='pos-rel'>
						<Tooltip title="Update license" sx={{ position: 'absolute', right: '10px', top: "-50px", cursor: 'pointer' }} >
							<IconButton onClick={() => { handleSettings(); }} >
								<SettingsIcon />
							</IconButton>
						</Tooltip>
					</Grid>

					{notifyMessage?.message && (<Grid size={12}>
						<NotifyMessage notifyMessage={notifyMessage} />
					</Grid>)}

					<Grid size={12}>
						<Tabs value={currentTab} onChange={(_event, newValue) => {
							if (newValue === 1)
								loadContentTypes();

							setCurrentTab(newValue)
						}
						}>
							<Tab label="Translation history for this space" id="simple-tab-0" iconPosition="start" icon={<HistoryIcon />} />
							<Tab label="Translate multiple stories" id="simple-tab-1" iconPosition="start" icon={<ViewCarouselIcon />} />
						</Tabs>
					</Grid>

					{currentTab === 0 && (<History list={history} />)}
					{currentTab === 1 && (<Grid container size={12} columnSpacing={2} style={{ paddingTop: "3em" }}>
						<RenderTranslateButton />
						<Grid size={12}>
							Available content types and languges: {contentTypes.length > 0 && contentTypes.filter(elem => elem.name).map((elem, idx) => <Chip 
								key={"c" + idx} label={elem.name ?? ""} style={{ marginRight: "5px", cursor: "pointer"}} 
								color={filterContentType === elem.name ? "primary" : "default"}
								onClick={() => { 
									if (elem.name === filterContentType)
										setFilterContentType("")
									else
										setFilterContentType(elem.name ?? "")
								}}
								/>
							)}
							{spaceLanguags.map((code) => <Chip
								label={code}
								key={"lang" + code}
								variant={"outlined"}
								style={{ marginRight: "0.5em" }}
							/>)}
						</Grid>
						<Grid size={{ xs:3, sm:2 }}>
							<Typography style={{ width: "100%", paddingBottom: "0.5em"}}>&nbsp;</Typography>
							{contentTypes.length > 0 && contentTypes.map((elem, idx) => {
								if (filterContentType !== "" && filterContentType !== elem.name)
									return <React.Fragment key={idx+elem.name} />

								return <React.Fragment key={idx+elem.name}>
									{elem.list.map((entry) => 
									<Stack spacing={2} direction="row" justifyContent={"flex-start"} sx={{ alignItems: 'left', width: "100%"}} key={"lr" + entry.id}>
											<Button 
												variant={entry.id === currentType ? "text" : "text"} 
												style={{ textAlign: "left",
													justifyContent: "flex-start",
												}} 
												fullWidth 
												startIcon={<WidgetsIcon />}
												color='secondary' 
												onClick={() => loadStoriesByType(entry.id, entry.name, elem.name)} disabled={entry.id === currentType}
											>
												<Typography variant='overline' style={{ lineHeight: "1.1em", textTransform: "capitalize" }}>
													{entry.name}
												</Typography>
											</Button>
										</Stack>)}
								</React.Fragment>
							})}
						</Grid>
						<Grid size={{ xs:9, sm:10 }}>
							{currentType > 0 ? <RenderStories /> : <RenderSelectContentType />}
						</Grid>
					</Grid>)}
				</Grid>
			</main>
		</>
	);
}
