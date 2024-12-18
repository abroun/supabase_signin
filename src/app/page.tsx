"use client"

import { createClient } from "@/utils/supabase/client"
import { App } from "@/components/app"

export default function Home() {
    const supabase = createClient()

    return (
        <App supabase={supabase} />
    );
}
