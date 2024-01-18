import React, {useState} from "react";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import {AppBar, Checkbox, Toolbar} from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import FormControlLabel from "@mui/material/FormControlLabel";
import {SingleUserProfileAPI} from "../../API/SingleUserProfileAPI";
import {toast} from "react-toastify";



export default function DoctorSpecializationAdditionDrawer(props){
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [checkedSpecializationsCheckBoxes, setCheckedSpecializationsCheckBoxes] = React.useState([]);

  const specializationList = Object.values(props.specializations)
  const currentSpecializationList = props.updatedSpecializationList;

  function initializeCheckedBoxes(specialization){
    for(var i=0;i<props.updatedSpecializationList.length;i++){
          if(specialization === props.updatedSpecializationList[i]){
            return true;
          }
    }
    return false;
  }
  const handleAddSpecializations= (doctorID, specializations,checkedSpecializationsCheckBoxes) => {
    let singleUserProfileAPI = new SingleUserProfileAPI();

    for(var i = 0;i<checkedSpecializationsCheckBoxes.length;i++){
      specializations.push(checkedSpecializationsCheckBoxes[i]);
    }

    let responseStatus = singleUserProfileAPI.addSpecializations(doctorID,  specializations);


    if (responseStatus === 200) {
      toast.success('Rotazione cancellata con successo', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    } else if (responseStatus === 400) {
      toast.error('Errore nella cancellazione', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    }
    setOpen(false);
    props.onPostAdd();
  }


  const handleCheckboxChange = (specialization) => {
    if (!checkedSpecializationsCheckBoxes.includes(specialization)) {
      setCheckedSpecializationsCheckBoxes(prev => [...prev, specialization]);
    }else {
      setCheckedSpecializationsCheckBoxes(checkedSpecializationsCheckBoxes.filter(item => item !== specialization));
    }
  };


  return (
    <>
      <Button
        onClick = {handleOpen}
        style   = {{
          'display'       : 'block',
          'margin-left'   : 'auto',
          'margin-right'  : 'auto',
          'margin-top'    : '1%',
          'margin-bottom' : '1%'
        }}
      >
          <i className="fa fa-plus" aria-hidden="true"></i>
      </Button>
      <Drawer anchor="bottom" open={open} onClose={handleClose}>
        <AppBar position="static" color="transparent">
          <Toolbar>
            <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'center' }}>
              <Typography variant="h5" component="div" sx={{ marginLeft: '20px' }}>
                Aggiungi Specializzazione
              </Typography>
            </Box>
            <IconButton color="inherit" onClick={handleClose}>
              <CloseIcon/>
            </IconButton>
          </Toolbar>
        </AppBar>

        <div style={{textAlign: 'center', padding: '20px'}}>
          <Box
            marginBottom    = {2}
            marginTop       = {2}
            display         = "flex"
            flexDirection   = "column"
            justifyContent  = "center"
            alignItems      = "center"
          >
            <p>
            </p>
            <Typography variant="h6">
              Seleziona le mansioni da assegnare:
            </Typography>
            {
                specializationList.map((item) => (
                      <FormControlLabel
                          control={
                            <Checkbox
                                disabled={initializeCheckedBoxes(item)}
                                defaultChecked={initializeCheckedBoxes(item)}
                                onChange={() => handleCheckboxChange(item)}
                            />
                          }
                          label={`${item}`}
                      />
                  ))
            }
          </Box>
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
          >
          </Box>
          <Box
            mt={4}
          >
            <Button
              variant="contained"
              disabled={checkedSpecializationsCheckBoxes.length === 0}
              onClick={ () => handleAddSpecializations(props.doctorID,currentSpecializationList,checkedSpecializationsCheckBoxes) }
            >
              Salva
            </Button>
          </Box>
        </div>
      </Drawer>
    </>
  );

}
