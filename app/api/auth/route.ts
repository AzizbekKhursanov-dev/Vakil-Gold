import { type NextRequest, NextResponse } from "next/server"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"
import { auth } from "@/lib/config/firebase"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { action, email, password } = await request.json()

    if (action === "login") {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      const token = await user.getIdToken()

      // Set secure HTTP-only cookie
      const cookieStore = cookies()
      cookieStore.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return NextResponse.json({
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        },
      })
    }

    if (action === "logout") {
      await signOut(auth)
      const cookieStore = cookies()
      cookieStore.delete("auth-token")

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("Auth error:", error)
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")

    if (!token) {
      return NextResponse.json({ authenticated: false })
    }

    // Verify token with Firebase Admin SDK would go here
    return NextResponse.json({ authenticated: true })
  } catch (error) {
    return NextResponse.json({ authenticated: false })
  }
}
