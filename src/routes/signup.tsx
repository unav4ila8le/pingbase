import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/signup')({
    component: SignupPage,
})

function SignupPage() {
    return (
        <div>
            <h1>Signup</h1>
        </div>
    )
}
