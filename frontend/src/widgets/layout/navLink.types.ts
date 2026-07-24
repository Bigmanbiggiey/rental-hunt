export interface NavLink {
  label: string;
  to: string;
}

export interface AuthNavLink extends NavLink {
  variant: 'outline' | 'default';
}
