/* eslint jsx-a11y/anchor-is-valid: 0 */

import React from 'react';
import {ViewState} from '@devexpress/dx-react-scheduler';
import {AllDayPanel} from '@devexpress/dx-react-scheduler-material-ui';
import { ServizioAPI } from '../../API/ServizioAPI';
import Stack from '@mui/material/Stack';
import {AppointmentContent, Content} from "../../components/common/CustomAppointmentComponents.js"
import Collapse from '@mui/material/Collapse';
import {
  Button,
  Paper,
} from "@mui/material";
import {
  Scheduler,
  Resources,
  Appointments,
  AppointmentTooltip,
  DayView,
  MonthView,
  DateNavigator,
  TodayButton,
  Toolbar,
  ViewSwitcher,
  WeekView, CurrentTimeIndicator,
  AppointmentForm,
} from '@devexpress/dx-react-scheduler-material-ui';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
   EditingState,IntegratedEditing
} from '@devexpress/dx-react-scheduler';
import { ServiceFilterSelectorButton } from '../../components/common/ServiceFilterSelectorButton';
import { UserAPI } from '../../API/UserAPI';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { HolidaysAPI } from '../../API/HolidaysAPI';
import { AssegnazioneTurnoAPI } from '../../API/AssegnazioneTurnoAPI';
import { BasicLayout, Nullcomponent, Overlay, OverlaySingle, SingleLayout } from '../../components/common/AssegnazioneTurnoModificaComponent';
import ButtonLegalSchedulation from '../../components/common/ButtonLegalSchedulation';
import { ShiftPrinterCSV } from "../../components/common/ShiftPrinterCSV";
import {
  RichiestaRimozioneDaTurnoAPI
} from "../../API/RichiestaRimozioneDaTurnoAPI";
import { t } from "i18next";


/**
 * Componente utilizzato per visualizzare i messaggi di errori della violazione dei vincoli
 * quando si modifica un assegnazione turno
 * @param {} props
 * @returns
 */
function ViolationLog(props){

  return (
    <div>
        <ul>
          {props.log.map((msg) => <li> {msg} </li>)}
        </ul>
    </div>
  );
}


/**
 * This view defines a generic shift schedule view.
 * Children are expected to query shifts from their preferred backend API
 * before the render() method is fired, i.e. overriding the componentDidMount() method
 *
 */
class ScheduleView extends React.Component{

    constructor(props) {
        super(props);
        this.state = {
          attore : localStorage.getItem("actor"),
            data: [],   // list of shifts to display in schedule (not filtered yet)
            mainResourceName: 'utenti_guardia',
            resources: [
              {fieldName: 'utenti_guardia', title: 'Guardia', allowMultiple: true,instances: [{}]},
              {fieldName: 'utenti_reperibili', title: 'Reperibilità',allowMultiple: true, instances: [{}]},
            ],
            /**
             * Filter criteria are the attributes used by filters to choose if a shift can be displayed.
             */
            filterCriteria: {

              /** what services we want to display? (default: all) */
              services: new Set(),
              users: [],

              // add more filter criteria here ...
            },
            /** all services registered in the system */
            allServices: new Set(),
            allUser : [],
            appointmentContentComponent : AppointmentContent,
            openOptionFilter: false,

            /** Holidays to display */
            holidays: [],

            /**
             * Com'è andata l'ultima volta che abbiamo chiesto i turni al backend?
             * "GOOD" --> I turni sono stati caricati con successo
             * "BAD" --> C'è stato un errore nel caricamento dei turni
             * "ABOUT_TO_ASK" --> Non abbiamo ancora chiesto i turni al backend, ma lo faremo appena possibile
             */
            shiftQueriedResponse: "ABOUT_TO_ASK",
            idUser: localStorage.getItem("id"),
            requests: [],
            lastYears : [new Date().getFullYear(), new Date().getFullYear() +1, new Date().getFullYear() -1]
          };
          /**
           * All filtering functions.
           * Each filter function must take a shift as input
           * and return true if the shift is feasible according to the filter conditions confronting
           * them to the filterCriteria specified in state.
           * We can adopt the following name convention to make the code more readable:
           * @function filterBy\<MyCriterion\>(shift) -> boolean
           */
          this.filters = [

            function filterByServices(shift){
              let services = this.state.filterCriteria.services;
              return services.size === 0 || services.has(shift.servizio);
            }.bind(this),

            function filterByUsers(shift){
              let users = this.state.filterCriteria.users;

              for (let i = 0; i < shift.utenti_guardia.length; i++)
                for (let j = 0; j < users.length; j++)
                  if(users[j].id === shift.utenti_guardia[i].id)
                    return true;

              return users.length === 0
            }.bind(this),

            // add more filters here ...
          ];
          this.changeMainResource = this.changeMainResource.bind(this);
          this.componentDidMount= this.componentDidMount.bind(this);
          this.updateFilterCriteria = this.updateFilterCriteria.bind(this);
          this.commitChanges = this.commitChanges.bind(this);
    }

    changeMainResource(mainResourceName) {
      this.setState({ mainResourceName });
    }

    pendingRetirementRequestForShiftExist = async (idShift) => {
      let idUser = -1;

      for (let i = 0; i < this.state.requests.length; i++) {
        if (this.state.requests[i].idShift === idShift) {
          idUser = this.state.requests[i].idRequestingUser;
          break;
        }
      }

      if (idUser !== -1) {
        let api = new UserAPI();
        const userDetails = await api.getUserDetails(idUser);
        let name = userDetails.name;
        let surname = userDetails.lastname;
        return `${name} ${surname}`
      }

      return idUser;

    }

    handleRetirement = async (justification, idShift) => {

      const params = {
        idShift: idShift,
        idRequestingUser: this.state.idUser,
        justification: justification,
        outcome: false
      }

      let richiestaRimozioneDaTurnoAPI = new RichiestaRimozioneDaTurnoAPI();
      let httpResponse = await richiestaRimozioneDaTurnoAPI.postRequest(params);

      if (httpResponse.status === 202) {
        toast.success(t("Request sent successfully"), {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });

      } else {
        toast.error(t("Request couldn't be forwarded"), {
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
    }

    /**
     * Questa funzione verrà invocata nel momento in cui il pianificatore effettua una modifica su una assegnazione turno.
     * Le modifiche effettuate su una assegnazione turno già esistente verranno inviate al backend.
     * @param {*} param0
     */
    async commitChanges({ added, changed, deleted }) {

      let assegnazioneTurnoApi = new AssegnazioneTurnoAPI();

      if(changed){
        let { data} = this.state;
        let appointmentChanged;

        /**
        * Il campo changed contiene l'id dell'assegnazione appena modificata e le modifiche apportate.
        * Un esempio changed = {idAssegnazione: {utenti_guardia:[...], utenti_reperibili: [...]}
        * Poichè l'id dell'assegnazione è espresso come numero e non è referenziato da una stringa
        * sono costretto a scorrere tutte le assegnazioni turni per verificare quell'id a quale asseganzione turno corrisponde
        */
        for( let i=0; i < data.length ; i++){
          if(changed[data[i].id])
            appointmentChanged=data[i]
        }


        let response = await assegnazioneTurnoApi.aggiornaAssegnazioneTurno(appointmentChanged,changed[appointmentChanged.id],localStorage.getItem("id"));
        let responseStatusClass = Math.floor(response.status / 100)

        if(responseStatusClass === 5){

          toast.error(t("Server Error"), {
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

        else if(responseStatusClass !== 2){

          let responseBody = await response.json();

          toast.error(ViolationLog({log : responseBody.messagges}), {
            position: "top-center",
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
            autoClose: false,
          });

        }else{

          toast.success(t("Assignment moified successfully"), {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
          });

          let turni = await assegnazioneTurnoApi.getGlobalShift();

          this.setState({data:turni});
          this.forceUpdate();
        }

      } else if(deleted){

        let response = await assegnazioneTurnoApi.eliminaAssegnazioneTurno(deleted);
        let responseStatusClass = Math.floor(response.status / 100);

        if(responseStatusClass !== 2){

          toast.error(t("Selected Assignment Couldn't Be Removed"), {
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

        else{

          toast.success(t("Elimination Successful"), {
            position: "top-center",
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
            autoClose: false,
          });

          let turni = await assegnazioneTurnoApi.getGlobalShift();

          this.setState({data:turni});
          this.forceUpdate();

        }


      }

    }

    /**
     * This function is passed as a callback to the filter selectors components, which
     * can use it to change the filter criteria in ScheduleView state.
     * It merely consists of a decorator adding a call to forceUpdate() to the updateLogic function
     * defined by the filter selector.
     * the updateLogic() function must take the filterCriteria object as argument and change its properties values.
     * An example: function updateLogic(filterCriteria) { filterCriteria.myAttribute = myValue; }
     */
    updateFilterCriteria(updateLogic) {
      this.setState(prevState => {
        const newFilterCriteria = { ...prevState.filterCriteria };
        newFilterCriteria.users = updateLogic(newFilterCriteria.users);
        return { filterCriteria: newFilterCriteria };
      });
    }


  async componentDidMount(turni) {

      let api = new RichiestaRimozioneDaTurnoAPI();
      let requestsArray = await api.getAllPendingRequests();

      let allServices = await new ServizioAPI().getService();
      let allDoctors = await new UserAPI().getAllDoctorsInfo();

      let holiApi = new HolidaysAPI() ;
      let allHolidays = await holiApi.getHolidays(new Date().getFullYear());
      allHolidays = allHolidays.concat(await holiApi.getHolidays(new Date().getFullYear() -1)) ;
      allHolidays = allHolidays.concat(await holiApi.getHolidays(new Date().getFullYear() +1)) ;


      this.setState(
        {
          requests: requestsArray,
          data: turni,
          mainResourceName: 'main_resource_dummy',
          resources:
            [
              {
                fieldName: 'utenti_guardia_id',
                title: 'Guardia',
                allowMultiple: true,
                instances: allDoctors,
              }
              , {
              fieldName: 'utenti_reperibili_id',
              title: 'Reperibilità',
              allowMultiple: true,
              instances: allDoctors,
            },
            ],
          allServices: new Set(allServices),
          allUser: allDoctors,
          holidays: allHolidays,
          shiftQueriedResponse: "GOOD",
        })


    }


    render(view){

      // add shifts to the schedulables to display
        let { data, resources} = this.state;

        /** Filtering of shifts is performed by ANDing results of all filter functions applied on each shift */
        data = data.filter((shift) => {
          return this.filters.reduce(
            (isFeasible, currentFilter) => isFeasible && currentFilter(shift, this.state.filterCriteria),
            true
          );
        });

        /**
         * Prepariamo un messaggio diverso per il link al download del csv con i turni
         * in base a se tali turni sono disponibili.
         */
        let shifts = data.slice();
        let textLink = "";
        switch(this.state.shiftQueriedResponse){
          case "GOOD":
            textLink= t("Download these turns as CSV")
            break;
          case "BAD":
            textLink=t("Turn Backend Failure")
            break;
          case "ABOUT_TO_ASK":
            textLink=t("Loading")
            break;
          default:
            // this should never appear
            textLink="Unexpected shiftQueriedResponse value: "+this.state.shiftQueriedResponse + "🫠"
            break;
        }

        // add holidays to the schedulables to display
        data.push(...this.state.holidays);

        return (
          <React.Fragment>
            {(view !== "global" || this.state.attore === "PLANNER") &&
            <Button
              style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: view !== 'global' ? '1%' : '2%',
              marginBottom: view !== "global" ? '1%' : '0%'
              }}
              href={view === "global" ? "/richieste-ritiro" : "/richieste-ritiro?locale=true"}
            > {t("View Retire Requests History")}
            </Button>
            }
            <Paper>
              {/**
               * Al click, scarica la pianificazione visualizzata in formato CSV, ma solo se siamo riusciti a
               * caricare i turni dal backend.
               */}
               <ShiftPrinterCSV rawShifts={shifts} shiftsChanged={true} textLink={textLink} enable={this.state.shiftQueriedResponse === "GOOD"}></ShiftPrinterCSV>
              <Collapse in={this.state.openOptionFilter}>
                <Stack spacing={1} style={{
                      display: 'flex',
                      'padding-top': '10px',
                      justifyContent: 'center',
                      'alignItems': 'center'
                    }}>

                  <Autocomplete
                    onChange={(event, value) => {
                      this.updateFilterCriteria(()=>value)
                      }}
                    multiple
                    options={this.state.allUser}
                    getOptionLabel={(option) => `${option.name} ${option.lastname}`}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label={t('Doctors on Duty')} />}
                    renderOption={(props, option) => (
                      <li {...props}>
                        {`${option.name} ${option.lastname}`}
                      </li>
                    )}
                  />
                  {/** Service Filter selectors */}
                  <div style={{display : 'flex','justify-content': 'space-between','column-gap': '20px'}}>
                    {Array.from(this.state.allServices).map(
                      (service, i) => (
                        <ServiceFilterSelectorButton key={i} criterion={service} updateFilterCriteriaCallback={this.updateFilterCriteria}/>
                      ))}
                  </div>

                </Stack>
              </Collapse>

              <Button
                onClick={() => {
                  this.setState({openOptionFilter: !this.state.openOptionFilter});
                  //TODO remove
                  console.log("maglia oro")
                  console.log(this.state.allUser)
                  console.log("non paragonarmi a una bitch così")
                }}
                style={{
                  'display': 'block',
                  'margin-left': 'auto',
                  'margin-right': 'auto',
                  'margin-top':'1%',
                  'margin-bottom':'-1%'
                }}
              >
                {this.state.openOptionFilter?t("Close"):t("Filter")}
              </Button>

              <ButtonLegalSchedulation ></ButtonLegalSchedulation>

              <Scheduler
                locale={navigator.language}
                firstDayOfWeek={1}
                data={data}
              >
                <ViewState
                  onCurrentDateChange={async (currentDate) => {
                    if(!this.state.lastYears.includes(currentDate.getFullYear())) {
                      this.setState({
                        holidays : this.state.holidays.concat(await new HolidaysAPI().getHolidays(currentDate.getFullYear())),
                        lastYears : this.state.lastYears.concat([currentDate.getFullYear()])
                      }) ;
                    }
                    if(!this.state.lastYears.includes(currentDate.getFullYear() +1)) {
                      this.setState({
                        holidays : this.state.holidays.concat(await new HolidaysAPI().getHolidays(currentDate.getFullYear() +1)),
                        lastYears : this.state.lastYears.concat(([currentDate.getFullYear() +1]))
                      }) ;
                    }
                    if(!this.state.lastYears.includes(currentDate.getFullYear() -1)) {
                      this.setState({
                        holidays : this.state.holidays.concat(await new HolidaysAPI().getHolidays(currentDate.getFullYear() -1)),
                        lastYears : this.state.lastYears.concat([currentDate.getFullYear() -1])
                      }) ;
                    }
                  }}
                />
                <WeekView
                  displayName={t(  "Weekly")}
                  startDayHour={0}
                  endDayHour={24}
                  cellDuration={60}
                />
                <DayView
                  displayName={t(  "Daily")}
                  startDayHour={0}
                  endDayHour={24}
                  cellDuration={60}
                />
                <MonthView displayName={t(  "Monthly")} />
                <Toolbar/>


                <EditingState onCommitChanges={this.commitChanges}/>
                <IntegratedEditing/>
                <Appointments
                  appointmentContentComponent={(props) => (
                    <AppointmentContent attore={this.state.attore} {...props} />
                  )}
                />
                <AllDayPanel/>
                <Resources
                  data={resources}
                />
                <DateNavigator />

                <TodayButton  buttonComponent={(props) => {
                  return (
                    <Button onClick={() => props.setCurrentDate(new Date())}>
                      Oggi
                    </Button>

                  );
                }}/>
                <ViewSwitcher />


                {view==="global" && this.state.attore==="PLANNER" &&
                  //Visualizzo il bottone per eliminare un assegnazione solo se sono sulla schermata globale
                 //SOLO IL PIANIFICATORE PUO' MODIFICARE I TURNI
                  <AppointmentTooltip
                    header
                    showCloseButton
                    showOpenButton
                    showDeleteButton
                    contentComponent={(props) => (
                      <Content {...props} view={view} actor={this.state.attore} checkRequests={this.pendingRetirementRequestForShiftExist} />
                    )}
                  />
                }

                {view === "global" && (this.state.attore === "DOCTOR" || this.state.attore === "CONFIGURATOR") &&
                < AppointmentTooltip
                  contentComponent={(props) => (
                    <Content {...props} view={view} actor={this.state.attore}/>
                  )}
                />
                }

                {view!=="global" &&
                  //Se sono sulla schermata "singola" non visualizzo il bottone per eliminare l'assegnazione turno
                  <AppointmentTooltip
                    showCloseButton
                    showOpenButton
                    contentComponent={(props) => (
                      <Content {...props} view={view} onRetirement={this.handleRetirement} actor={this.state.attore} />
                    )}
                  />
                }

                <CurrentTimeIndicator
                  shadePreviousAppointments={true}
                  shadePreviousCells={true}
                  updateInterval={60000}
                />

                {view === "global" && (this.state.attore === "PLANNER" || this.state.attore  ===  "CONFIGURATOR") ?
                  <AppointmentForm
                    overlayComponent = {Overlay}
                    textEditorComponent={Nullcomponent}
                    labelComponent={Nullcomponent}
                    booleanEditorComponent={Nullcomponent}
                    dateEditorComponent ={Nullcomponent}
                    basicLayoutComponent={BasicLayout}
                  />
                  :
                  <AppointmentForm
                    overlayComponent = {OverlaySingle}
                    textEditorComponent={Nullcomponent}
                    labelComponent={Nullcomponent}
                    booleanEditorComponent={Nullcomponent}
                    dateEditorComponent ={Nullcomponent}
                    basicLayoutComponent={SingleLayout.bind(this)}
                    readOnly
                />
                }



              </Scheduler>

            </Paper>
          </React.Fragment>

        );

    }

}

export default ScheduleView;
