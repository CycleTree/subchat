  async configureApiKey(provider: string, apiKey: string): Promise<void> {
    console.log(`🔑 Configuring ${provider} API key`);
    
    const envVarMap: Record<string, string> = {
      anthropic: "ANTHROPIC_API_KEY",
      openai: "OPENAI_API_KEY", 
      gemini: "GEMINI_API_KEY"
    };
    
    const envVar = envVarMap[provider];
    if (!envVar) {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    
    // Try multiple formats until one works
    const formats = [
      {
        name: "JSON string format",
        params: {
          raw: JSON.stringify({
            env: {
              [envVar]: apiKey
            }
          })
        }
      },
      {
        name: "Direct raw value",
        params: {
          raw: apiKey,
          path: `env.${envVar}`
        }
      },
      {
        name: "Simple raw object",
        params: {
          raw: `env.${envVar}=${apiKey}`
        }
      },
      {
        name: "Alternative env.set method",
        method: "env.set",
        params: {
          [envVar]: apiKey
        }
      }
    ];
    
    for (const format of formats) {
      try {
        console.log(`🔧 Trying ${format.name}...`);
        const method = format.method || "config.set";
        const result = await this.request(method, format.params);
        console.log(`✅ ${provider} API key configured with ${format.name}:`, result);
        return;
      } catch (error) {
        console.log(`❌ ${format.name} failed:`, error);
      }
    }
    
    throw new Error(`Failed to configure ${provider}: All configuration formats failed`);
  }

  async spawnSession(task: string, agentId?: string): Promise<string> {
    console.log("🚀 Spawning new session with task:", task);
    
    const result = await this.request("sessions.spawn", {
      task: task,
      runtime: "subagent",
      mode: "session",
      agentId: agentId || "main",
      label: `SubChat-${Date.now()}`,
      thinking: "low"
    });
    
    console.log("✅ Session spawned:", result);
    return result.sessionKey || result.id || result.key;
  }

  async startNewConversation(initialMessage: string): Promise<string> {
    console.log("💬 Starting new conversation with:", initialMessage);
    
    const sessionId = await this.spawnSession(`User wants to chat: ${initialMessage}`);
    await this.sendMessage(sessionId, initialMessage);
    
    console.log("✅ New conversation started:", sessionId);
    return sessionId;
  }
