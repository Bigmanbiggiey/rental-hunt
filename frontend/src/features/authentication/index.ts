// Public surface of the authentication feature — components and hooks other
// layers are allowed to import. Services/Repositories/schemas stay internal.
export { RegisterForm } from './components/RegisterForm';
export { LoginForm } from './components/LoginForm';
export { ProtectedRoute } from './components/ProtectedRoute';
export { useRegister } from './hooks/useRegister';
export { useLogin } from './hooks/useLogin';
export { useLogout } from './hooks/useLogout';
