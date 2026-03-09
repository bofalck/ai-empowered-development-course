/**
 * Database operations and Supabase client initialization
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.47.0/+esm';

const supabaseUrl = 'https://xqpqcuvvjgnjtqmhrtku.supabase.co';
const supabaseKey = 'sb_publishable_XsrMMvQjHZcj6Cql1xA5Fw_nF9nfubb';
const supabase = createClient(supabaseUrl, supabaseKey);

// Load meetings from Supabase
async function loadMeetings() {
    const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading meetings:', error);
        return [];
    }

    return data || [];
}

// Save meeting to Supabase
async function saveMeetingToSupabase(title, transcript, segments, duration) {
    try {
        const { data, error } = await supabase
            .from('meetings')
            .insert([
                {
                    user_id: localStorage.getItem('user_id') || 'anonymous',
                    title: title,
                    transcript: transcript,
                    duration: duration,
                    segments: segments,
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving meeting:', error);
        throw error;
    }
}

// Save tags to meeting
async function saveMeetingTags(meetingId, tags) {
    try {
        const { error } = await supabase
            .from('meetings')
            .update({ tags })
            .eq('id', meetingId);

        if (error) throw error;
    } catch (error) {
        console.error('Error saving tags:', error);
        throw error;
    }
}

// Save analysis to Supabase
async function saveAnalysisToSupabase(meetingId, analysis) {
    try {
        const { data, error } = await supabase
            .from('analyses')
            .insert([
                {
                    meeting_id: meetingId,
                    summary: analysis.summary || '',
                    action_items: analysis.action_items || [],
                    sentiment: analysis.sentiment || '',
                    suggested_tags: analysis.suggested_tags || [],
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving analysis:', error);
        throw error;
    }
}

// Fetch analysis for a meeting
async function fetchAnalysis(meetingId) {
    try {
        const { data, error } = await supabase
            .from('analyses')
            .select('*')
            .eq('meeting_id', meetingId)
            .single();

        if (error) {
            console.log('No analysis yet for this meeting');
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error fetching analysis:', error);
        return null;
    }
}

// Delete old analysis
async function deleteAnalysis(meetingId) {
    try {
        const { error } = await supabase
            .from('analyses')
            .delete()
            .eq('meeting_id', meetingId);

        if (error) console.error('Error deleting old analysis:', error);
    } catch (error) {
        console.error('Error deleting analysis:', error);
    }
}

// Save action items changes to database
async function saveActionItemsChanges(analysisId, actionItems) {
    if (!analysisId) return;

    try {
        const { error } = await supabase
            .from('analyses')
            .update({
                action_items: actionItems
            })
            .eq('id', analysisId);

        if (error) throw error;
    } catch (error) {
        console.error('Error saving action items:', error);
    }
}

// Get meeting from Supabase by ID
async function getMeetingById(id) {
    try {
        const { data, error } = await supabase
            .from('meetings')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching meeting:', error);
        return null;
    }
}

// Update meeting transcript
async function updateMeetingTranscript(meetingId, transcript) {
    try {
        const { error } = await supabase
            .from('meetings')
            .update({ transcript })
            .eq('id', meetingId);

        if (error) throw error;
    } catch (error) {
        console.error('Error updating transcript:', error);
        throw error;
    }
}

export {
    supabase,
    loadMeetings,
    saveMeetingToSupabase,
    saveMeetingTags,
    saveAnalysisToSupabase,
    fetchAnalysis,
    deleteAnalysis,
    saveActionItemsChanges,
    getMeetingById,
    updateMeetingTranscript
};
