import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm'

// Инициализация клиента Supabase
const SUPABASE_URL = 'https://ivgfubqdbtnhivgftzau.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2Z2Z1YnFkYnRuaGl2Z2Z0emF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MTk2ODUsImV4cCI6MjA2Mjk5NTY4NX0.TKIxd-tY0cY3Qa3wXSrEgnzNnK1g4LjGURiWowmgZF8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export async function signInAnonymously() {
    console.log("Attempting anonymous sign-in...");
    const email = `anonymous_${Date.now()}@temp.com`;
    const password = `temp_${Date.now()}_${Math.random()}`;

    const { data, error } = await supabase.auth.signUp({ 
        email: email,
        password: password,
    });

    if (error) {
        console.error('Error in signInAnonymously (signUp):', error);
        return null; 
    }

    console.log('Anonymous signUp successful, user data:', data.user);
    console.log('Anonymous signUp successful, session data:', data.session); 

    if (!data.user || !data.session) {
        console.error('Anonymous signUp did not return user or session.');
        return null;
    }

    return data.user; 
}

export async function submitScore(score, displayName) {
    let currentUser;
    let currentSession;

    const { data: { session: activeSession }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
        console.error('Error getting current session:', sessionError);
    }

    if (activeSession && activeSession.user) {
        console.log('Using existing active session:', activeSession);
        currentUser = activeSession.user;
        currentSession = activeSession;
    } else {
        console.log('No active session found, attempting anonymous sign-in.');
        const anonUser = await signInAnonymously();
        if (!anonUser) {
            console.error('Failed to sign in anonymously and no user obtained.');
            return null;
        }
        currentUser = anonUser;
        const { data: { session: newAnonSession } } = await supabase.auth.getSession();
        if (!newAnonSession || newAnonSession.user.id !== currentUser.id) {
            console.error('Session for anonymous user was not properly set or retrieved.');
            return null;
        }
        console.log('Anonymous user session is now active:', newAnonSession);
        currentSession = newAnonSession;
    }

    if (!currentUser || !currentUser.id) {
        console.error('No user or user.id available to submit score.');
        return null;
    }

    console.log('Attempting to insert score for user_id:', currentUser.id, 'with score:', score, 'and displayName:', displayName);
    console.log('Current session access_token (first 10 chars):', currentSession?.access_token?.substring(0,10));

    const { data, error } = await supabase
        .from('leaderboard')
        .insert([
            {
                user_id: currentUser.id,
                score: score,
                display_name: displayName
            }
        ]); 

    if (error) {
        console.error('Error submitting score (from .insert()):', error);
        const { data: { session: sessionAtError } } = await supabase.auth.getSession();
        console.error('Session state at time of insert error:', sessionAtError);
        return null;
    }
    console.log('Score submitted successfully, insert result:', data); 
    return { success: true, userId: currentUser.id, score: score }; 
}

export async function getTopScores(limit = 10) {
    const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit)

    if (error) console.error('Error fetching scores:', error)
    return data || []
}