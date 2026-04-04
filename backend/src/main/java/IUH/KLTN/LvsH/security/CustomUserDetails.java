package IUH.KLTN.LvsH.security;

import IUH.KLTN.LvsH.entity.Staff;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

public class CustomUserDetails implements UserDetails {

    private final Staff staff;

    public CustomUserDetails(Staff staff) {
        this.staff = staff;
    }

    public Staff getStaff() {
        return staff;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Gáº¯n ROLE_ vÃ o trÆ°á»›c Ä‘á»ƒ Spring Security nháº­n diá»‡n Ä‘Æ°á»£c dÃ¹ng hasRole
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + staff.getRole()));
    }

    @Override
    public String getPassword() {
        return staff.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return staff.getUsername();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return staff.getIsActive(); // KhÃ³a náº¿u bá»‹ vÃ´ hiá»‡u hÃ³a
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return staff.getIsActive();
    }
}
