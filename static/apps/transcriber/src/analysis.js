/**
 * AI analysis and meeting analysis logic
 */

import { saveAnalysisToSupabase, deleteAnalysis, loadMeetings } from './database.js';
import { normalizeActionItems } from './utils.js';

let currentAnalysis = null;
let currentSuggestedTags = [];
let currentSelectedTags = [];

// Get current analysis
function getCurrentAnalysis() {
    return currentAnalysis;
}

// Set current analysis
function setCurrentAnalysis(analysis) {
    currentAnalysis = analysis;
}

// Analyze meeting using GPT via Netlight proxy
async function analyzeMeeting(meetingId, transcript) {
    try {
        const status = document.getElementById('recordingStatus');
        status.textContent = 'Analyzing meeting...';

        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('API key not configured');
        }

        const response = await fetch(
            'https://llm.netlight.ai/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-5',
                    messages: [
                        {
                            role: 'user',
                            content: `Analyze this meeting transcript and provide:

1. EXECUTIVE SUMMARY: 2-3 key points from the meeting
2. ACTION ITEMS: List of specific tasks/decisions with owners if mentioned
3. SENTIMENT: Overall tone (Positive/Neutral/Negative) with brief explanation
4. SUGGESTED TAGS: 3-5 relevant tags that categorize this meeting (e.g., "Planning", "Product", "Decision", "Urgent", "Follow-up")

Format your response as valid JSON with these keys: "summary" (string), "action_items" (array of strings), "sentiment" (string), "suggested_tags" (array of strings).

Transcript:
${transcript}`,
                        },
                    ],
                    max_tokens: 4096,
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
        }

        const apiResponse = await response.json();
        const responseText = apiResponse.choices[0].message.content;

        // Parse JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const analysis = jsonMatch
            ? JSON.parse(jsonMatch[0])
            : { error: 'Parse failed', rawResponse: responseText };

        // Normalize action items to new format
        const normalizedAnalysis = {
            meeting_id: meetingId,
            summary: analysis.summary || '',
            action_items: normalizeActionItems(analysis.action_items || []),
            sentiment: analysis.sentiment || '',
            suggested_tags: analysis.suggested_tags || [],
        };

        // Save analysis to Supabase
        const savedAnalysis = await saveAnalysisToSupabase(meetingId, normalizedAnalysis);

        currentAnalysis = savedAnalysis;
        status.textContent = 'Analysis complete';

        return savedAnalysis;
    } catch (error) {
        console.error('Error analyzing meeting:', error);
        const status = document.getElementById('recordingStatus');
        status.textContent = 'Analysis failed: ' + error.message;
        throw error;
    }
}

// Re-analyze a meeting
async function reanalyzeMeeting(meetingId, transcript) {
    try {
        // Delete old analysis if exists
        await deleteAnalysis(meetingId);

        // Run new analysis
        await analyzeMeeting(meetingId, transcript);

        // Reload meetings
        await loadMeetings();
    } catch (error) {
        console.error('Error re-analyzing meeting:', error);
        throw error;
    }
}

// Save action items changes to database
async function saveActionItemsChanges(analysisId, actionItems) {
    if (!analysisId || !currentAnalysis) return;

    try {
        const { supabase } = await import('./database.js');
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

// Get suggested tags
function getSuggestedTags() {
    return currentSuggestedTags;
}

// Set suggested tags
function setSuggestedTags(tags) {
    currentSuggestedTags = tags;
}

// Get selected tags
function getSelectedTags() {
    return currentSelectedTags;
}

// Set selected tags
function setSelectedTags(tags) {
    currentSelectedTags = tags;
}

// Clear selected tags
function clearSelectedTags() {
    currentSelectedTags = [];
}

export {
    getCurrentAnalysis,
    setCurrentAnalysis,
    analyzeMeeting,
    reanalyzeMeeting,
    saveActionItemsChanges,
    getSuggestedTags,
    setSuggestedTags,
    getSelectedTags,
    setSelectedTags,
    clearSelectedTags
};
