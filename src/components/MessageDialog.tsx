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