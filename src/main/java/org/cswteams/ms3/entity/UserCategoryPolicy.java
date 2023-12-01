package org.cswteams.ms3.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.NonNull;

import javax.persistence.*;

/**
 * Modella se una categoria utente è vietata o necessaria per un turno
 */
@Entity
@Data
 public class UserCategoryPolicy {
    
    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne
    @NonNull
    private Categoria categoria;

    @ManyToOne
    @JsonIgnore
    @NonNull
    private Turno turno;
    
    /** 
     * La registrazione di questa policy nel db implica che tale categoria è da escludere
     * o da includere per un turno. Se così non fosse, non sarebbe stata registrata.
     * 
     * 
    */
    @NonNull
    @Enumerated(value = EnumType.STRING)
    private UserCategoryPolicyValue policy;

    public UserCategoryPolicy(){

    }

   public UserCategoryPolicy(Categoria categoria, Turno turno, UserCategoryPolicyValue value){
      this.categoria = categoria;
      this.turno = turno;
      this.policy = value;
   }
}
