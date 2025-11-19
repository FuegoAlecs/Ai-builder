    // Add page prompt
    messages.push({
      role: 'user',
      content: pagePrompt
    });
    
    // Generate page using AI with increased token limit for complex pages
    const code = await callGroqStream(
      {
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.2,
        max_tokens: 8192 // Increased for larger page components
      },
      onChunk
    );
    
    if (!code || code.trim().length === 0) {
      throw new Error(`AI generated empty code for page ${pageName}`);
    }
    
    return code;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [ERROR] [Code Agent] Failed to generate page ${fileSpec.name}:`, error);
    throw new Error(`Page generation failed: ${error.message}`);
  }
}
