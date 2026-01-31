import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
    component: LoginPage,
})

function LoginPage() {
    return (
        <div>
            <h1>Login</h1>
        </div>
    )
}
