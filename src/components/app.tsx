
import { useState, useEffect } from "react"
import { 
    AuthError,
    Session,
    SupabaseClient,
    EmailOtpType
} from "@supabase/supabase-js"

import { Header } from "./header"

export interface AppProps {
    supabase: SupabaseClient
}

export function App({ supabase }: AppProps) {
    const [session, setSession] = useState<Session | null>(null)
    const [userEmail, setUserEmail] = useState("")
    const [otp, setOtp] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const [makingServerRequest, setMakingServerRequest] = useState<boolean>(false)
    const [verifyingOTP, setVerifyingOTP] = useState<boolean>(false)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        return () => subscription.unsubscribe()
    }, [supabase])

    const signedIn = (session !== null)

    const onRequestOTP = async () => {
        setMakingServerRequest(true)

        try {
            // Request an OTP for the email address, creating an account if one does not already exist
            const { error } = await supabase.auth.signInWithOtp({
                email: userEmail,
                options: {
                    shouldCreateUser: true
                },
            })

            if (error) {
                setErrorMessage(error.message)
            } else {
                setErrorMessage("")
                setVerifyingOTP(true)
            }
        } finally {
            setMakingServerRequest(false)
        }
    }

    const onVerifyOTP = async () => {
        setMakingServerRequest(true)

        try {
            let error: AuthError | null = null

            // We can't know whether the OTP came from an existing account, or a new account creation attempt so we check both
            const TOKEN_TYPES: EmailOtpType[] = ["magiclink", "signup"]
            for (const tokenType of TOKEN_TYPES) {
                const response = await supabase.auth.verifyOtp({
                    email: userEmail,
                    token: otp,
                    type: tokenType
                })

                error = response.error
                if (error === null) {
                    break
                }
            }

            if (error) {
                setErrorMessage(error.message)
            } else {
                // Sign in has succeeded
                setErrorMessage("")
                setVerifyingOTP(false)
                setUserEmail("")
                setOtp("")
            }
        } finally {
            setMakingServerRequest(false)
        }
    }

    const onSignOutClicked = async () => {
        await supabase.auth.signOut()
    }

    return (
        <div className="app-wrapper">
            <Header signedIn={signedIn} onSignOutClicked={onSignOutClicked}/>
            {signedIn ? (<iframe className="gauzilla-embed" src="data/gauzilla/index.html?url=cat.splat"></iframe>)
                : (
                <div className="app-body">
                    <h1>Get Access</h1>
                    {!verifyingOTP ? (
                        <div>
                            <label htmlFor="email">Enter your email to get an access code:</label>
                            <input type="email" name="email" value={userEmail} onInput={e => setUserEmail((e.target as HTMLInputElement).value)} />
                            <button onClick={onRequestOTP} disabled={makingServerRequest}>{makingServerRequest ? "Requesting..." : "Submit"}</button>
                        </div>
                    ) : (
                        <div>
                            <p>An access code has been sent</p>
                            <label htmlFor="otp">Please enter the access code:</label>
                            <input type="text" name="otp" value={otp} onInput={e => setOtp((e.target as HTMLInputElement).value)} />
                            <button onClick={onVerifyOTP} disabled={makingServerRequest}>{makingServerRequest ? "Checking..." : "Submit"}</button>
                        </div>
                    )}
                    {errorMessage && (<div className="error-msg">
                        Error: {errorMessage}
                    </div>)}
                    {verifyingOTP && <a onClick={() => setVerifyingOTP(false)}>Forgotten or lost code?</a>}
                </div>)}
        </div>
    )
}