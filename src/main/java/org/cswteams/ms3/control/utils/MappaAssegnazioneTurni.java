package org.cswteams.ms3.control.utils;

import org.cswteams.ms3.dto.AssegnazioneTurnoDTO;
import org.cswteams.ms3.dto.UtenteDTO;
import org.cswteams.ms3.entity.AssegnazioneTurno;

import java.sql.Timestamp;
import java.time.*;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

public class MappaAssegnazioneTurni {


  /*  public static AssegnazioneTurno assegnazioneTurnoDTOToEntity(AssegnazioneTurnoDTO dto) throws TurnoException {
        // FIXME: DA SISTEMARE, DEVE PRENDERLO DAL DB
        Turno turno = new Turno(dto.getIdTurno(), dto.getInizio().toLocalDateTime().toLocalTime(), dto.getFine().toLocalDateTime().toLocalTime(), MappaServizio.servizioDTOtoEntity(dto.getServizio()), dto.getTipologiaTurno(),dto.isGiornoSuccessivoTurno());
        Set<Utente> diGuardia = MappaUtenti.utenteDTOtoEntity(dto.getUtentiDiGuardia());
        Set<Utente> reperibili = MappaUtenti.utenteDTOtoEntity(dto.getUtentiReperibili());
        turno.setMansione(dto.getMansione());

        return new AssegnazioneTurno(dto.getInizio().toLocalDateTime().toLocalDate(), turno, reperibili, diGuardia);
    }*/

    public static AssegnazioneTurnoDTO assegnazioneTurnoToDTO(AssegnazioneTurno entity) {

        LocalDateTime inizio = LocalDateTime.of(entity.getData(), entity.getTurno().getOraInizio());
        LocalDateTime fine = LocalDateTime.of(entity.getData(), entity.getTurno().getOraFine());

        if(entity.getTurno().isGiornoSuccessivo()){
            fine = LocalDateTime.of(entity.getData().plusDays(1), entity.getTurno().getOraFine());
        }

        Instant instantinizio = inizio.atZone(ZoneId.systemDefault()).toInstant();
        Instant instantfine = fine.atZone(ZoneId.systemDefault()).toInstant();

        Date dateinizio = Date.from(instantinizio);
        Date datefine = Date.from(instantfine);

        Timestamp timestampInizio = new Timestamp(dateinizio.getTime());
        Timestamp timestampFine = new Timestamp(datefine.getTime());
        Set<UtenteDTO> diGuardiaDto = MappaUtenti.utentiEntitytoDTO(entity.getUtentiDiGuardia());
        Set<UtenteDTO> reperibiliDto = MappaUtenti.utentiEntitytoDTO(entity.getUtentiReperibili());
        Set<UtenteDTO> rimossiDto = MappaUtenti.utentiEntitytoDTO(entity.getRetiredUsers());
        AssegnazioneTurnoDTO dto = new AssegnazioneTurnoDTO(entity.getId(), entity.getTurno().getId(), timestampInizio, timestampFine, diGuardiaDto, reperibiliDto, MappaServizio.servizioEntitytoDTO(entity.getTurno().getServizio()), entity.getTurno().getTipologiaTurno(), entity.getTurno().isGiornoSuccessivo(), entity.getTurno().isReperibilitaAttiva());
        dto.setMansione(entity.getTurno().getMansione());
        dto.setRetiredUsers(rimossiDto);
        return dto;
    }

    public static Set<AssegnazioneTurnoDTO> assegnazioneTurnoToDTO(Set<AssegnazioneTurno> turni) {
        Set<AssegnazioneTurnoDTO> assegnazioneTurnoDTOS = new HashSet<>();
        for (AssegnazioneTurno entity : turni) {
            assegnazioneTurnoDTOS.add(assegnazioneTurnoToDTO(entity));
        }
        return assegnazioneTurnoDTOS;
    }



}

