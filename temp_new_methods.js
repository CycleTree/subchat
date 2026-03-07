
  async spawnSession(task: string, agentId?: string): Promise<string> {
    console.log('🚀 Spawning new session with task:', task);
    
    const result = await this.request('sessions.spawn', {
      task: task,
      runtime: 'subagent',
      mode: 'session',
      agentId: agentId || 'main',
      label: `SubChat-${Date.now()}`,
      thinking: 'low'
    });
    
    console.log('✅ Session spawned:', result);
    
    // Return the session key/ID
    return result.sessionKey || result.id || result.key;
  }

  async startNewConversation(initialMessage: string): Promise<string> {
    console.log('💬 Starting new conversation with:', initialMessage);
    
    // Spawn a new session with the initial message as the task
    const sessionId = await this.spawnSession(`User wants to chat: ${initialMessage}`);
    
    // Send the initial message to the new session
    await this.sendMessage(sessionId, initialMessage);
    
    console.log('✅ New conversation started:', sessionId);
    return sessionId;
  }
