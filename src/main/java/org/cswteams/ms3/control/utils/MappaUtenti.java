package org.cswteams.ms3.control.utils;

import org.cswteams.ms3.dto.UtenteDTO;
import org.cswteams.ms3.entity.Utente;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class MappaUtenti {

    public static Utente utenteDTOtoEntity(UtenteDTO utenteDTO) {
        return new Utente(utenteDTO.getId(),utenteDTO.getNome(),utenteDTO.getCognome(),utenteDTO.getCodiceFiscale(),utenteDTO.getDataNascita(),utenteDTO.getEmail(), utenteDTO.getPassword(), utenteDTO.getRuoloEnum(),utenteDTO.getCategorie(),utenteDTO.getAttore());
    }

    public static Set<Utente> utenteDTOtoEntity(Set<UtenteDTO> utentiDto) {
        Set<Utente> utenti = new HashSet<>();
        for (UtenteDTO dto: utentiDto){
            utenti.add(utenteDTOtoEntity(dto));
        }
        return utenti;
    }


    public static UtenteDTO utenteEntitytoDTO(Utente utente) {
        return new UtenteDTO(utente.getId(), utente.getNome(), utente.getCognome(), utente.getDataNascita(), utente.getCodiceFiscale(), utente.getRuoloEnum(), utente.getEmail(), utente.getPassword(), utente.getStato(), utente.getSpecializzazioni(), utente.getAttore());
    }

    public static Set<UtenteDTO> utentiEntitytoDTO(Set<Utente> utenti){
        Set<UtenteDTO> utenteDTOS = new HashSet<>();
        for (Utente entity: utenti){
            utenteDTOS.add(utenteEntitytoDTO(entity));
        }
        return utenteDTOS;
    }

    public static Set<UtenteDTO> utentiEntitytoDTO(List<Utente> utenti){
        Set<UtenteDTO> utenteDTOS = new HashSet<>();
        for (Utente entity: utenti){
            utenteDTOS.add(utenteEntitytoDTO(entity));
        }
        return utenteDTOS;
    }

}
