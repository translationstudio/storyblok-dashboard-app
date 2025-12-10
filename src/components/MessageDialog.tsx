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
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";

export type MessageDialogType = {
    confirm?: boolean;
    title: string;
    text: string;
    callback?: Function
}


const MessageDialog = function(props:{data:MessageDialogType, onClose:Function})
{
    const fnCallback = function()
    {
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

export default MessageDialog;