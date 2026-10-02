import React, { createContext, useContext, useState } from 'react';
import type { UserRole } from '../types';

interface AuthContextType {
  role: UserRole;
  userName: string;
  roleTitle: string;
  setRole: (role: UserRole) => void;
  availableRoles: { id: UserRole; title: string; subtitle: string; iconName: string }[];
}

const ROLES_META: { id: UserRole; title: string; subtitle: string; iconName: string }[] = [
  {
    id: 'EXPERT_AGRICOLE',
    title: 'Expert Agricole',
    subtitle: 'Terrain, Blocs B01-B16 & Récoltes',
    iconName: 'Sprout'
  },
  {
    id: 'RESPONSABLE_USINE',
    title: 'Responsable Usine',
    subtitle: 'Transformation, Lignes & Qualité',
    iconName: 'Factory'
  },
  {
    id: 'PORTEUR_PROJET',
    title: 'Porteur du Projet',
    subtitle: 'Commercialisation, WhatsApp & Pilotage',
    iconName: 'TrendingUp'
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('gf_user_role');
    return (saved as UserRole) || 'EXPERT_AGRICOLE';
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('gf_user_role', newRole);
  };

  const currentMeta = ROLES_META.find((r) => r.id === role)!;
  const userName =
    role === 'EXPERT_AGRICOLE'
      ? 'Dr. Jean-Paul Mbarga'
      : role === 'RESPONSABLE_USINE'
      ? 'Suzanne Kamga, Ing.'
      : 'Rostand (Direction Générale)';

  return (
    <AuthContext.Provider
      value={{
        role,
        userName,
        roleTitle: currentMeta.title,
        setRole,
        availableRoles: ROLES_META
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
