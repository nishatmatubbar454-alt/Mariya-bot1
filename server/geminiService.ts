import { GoogleGenAI } from "@google/genai";
import { getSettings } from "./firebaseService.js";

// Cooldown tracker for models that hit 429 rate limit
const modelCooldowns = new Map<string, number>();

function isModelCoolingDown(modelName: string): boolean {
  const until = modelCooldowns.get(modelName);
  if (!until) return false;
  if (Date.now() < until) return true;
  modelCooldowns.delete(modelName);
  return false;
}

function setModelCooldown(modelName: string, durationMs: number = 60000) {
  modelCooldowns.set(modelName, Date.now() + durationMs);
}

// Context-aware diverse fallbacks in case network drops or all models fail
function getSmartFallback(userMessage: string, userFirstName?: string): string {
  const lower = (userMessage || '').toLowerCase();
  const namePart = userFirstName ? `${userFirstName}, ` : '';
  
  if (
    lower.includes('খুঁজে পাচ্ছি না') || 
    lower.includes('পাচ্ছি না') || 
    lower.includes('খুজে পাই না') || 
    lower.includes('খুঁজব') || 
    lower.includes('কোথায় পাব') ||
    lower.includes('কোথায় পাব')
  ) {
    return `${namePart}আমাদের মিনি ওয়েবের ওপরের অংশে একটি সার্চ ইঞ্জিন রয়েছে। নিচের মিনি ওয়েব বাটনে ক্লিক করে ওপেন করুন এবং সেখানে সার্চ করলেই সহজেই সব ভিডিও পেয়ে যাবেন!`;
  }

  if (
    lower.includes('ভিডিও') || 
    lower.includes('মুভি') || 
    lower.includes('video') || 
    lower.includes('টিকটক') || 
    lower.includes('tiktok') || 
    lower.includes('নতুন')
  ) {
    const variations = [
      `আমাদের মিনি ওয়েবের মধ্যে সকল ধরনের বাংলাদেশী নতুন ভাইরাল ভিডিও ও টিকটকারদের কনটেন্ট পাওয়া যায়। সরাসরি দেখতে নিচের মিনি ওয়েব বাটনে ক্লিক করুন 👇`,
      `আমাদের মিনি ওয়েবের মধ্যে সকল ধরনের ভিডিও ও নিয়মিত নতুন টিকটক কনটেন্ট আপলোড করা হয়। নিচের মিনি ওয়েব বাটনে ক্লিক করে সব ভিডিও উপভোগ করুন!`,
      `সব ধরনের আকর্ষণীয় বাংলাদেশী ও টিকটক ভিডিও আমাদের মিনি ওয়েবের মধ্যেই পাওয়া যায়। দেখতে নিচের মিনি ওয়েব বাটনে ক্লিক করুন 👇`
    ];
    return variations[Math.floor(Math.random() * variations.length)];
  }

  if (lower.includes('কেমন') || lower.includes('হ্যালো') || lower.includes('hello') || lower.includes('hi') || lower.includes('সালাম')) {
    const greetings = [
      `হ্যালো! আশা করি আপনি ভালো আছেন। আমাদের মিনি ওয়েবের মধ্যে সকল ধরনের ভিডিও পাওয়া যায় — দেখতে নিচের মিনি ওয়েব বাটনে ক্লিক করুন 👇`,
      `সালাম ও শুভেচ্ছা! আপনার দিনটি শুভ হোক। আমাদের মিনি ওয়েবের মধ্যে সকল ধরনের ভিডিও পাওয়া যায়, নিচের বাটনে ক্লিক করে মিনি ওয়েবে প্রবেশ করুন।`,
      `হ্যালো ${namePart}! কেমন আছেন? আমাদের মিনি ওয়েবের মধ্যে সকল ধরনের ভিডিও কালেকশন রয়েছে, দেখতে নিচের মিনি ওয়েব বাটনে ক্লিক করুন 👇`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  const defaultReplies = [
    `আপনার সুন্দর বার্তার জন্য ধন্যবাদ! আমাদের মিনি ওয়েবের মধ্যে সকল ধরনের ভিডিও ও নতুন কনটেন্ট পাওয়া যায় — নিচের মিনি ওয়েব বাটনে ক্লিক করে সরাসরি দেখে নিন।`,
    `ধন্যবাদ আপনার মেসেজের জন্য! আমাদের মিনি ওয়েবের মধ্যে সকল ধরনের বাংলাদেশী ভাইরাল ভিডিও পাওয়া যায়। দেখতে নিচের মিনি ওয়েব বাটনে ক্লিক করুন 👇`,
    `আপনার প্রশ্নের জন্য ধন্যবাদ! আমাদের মিনি ওয়েবের মধ্যে সকল ধরনের ভিডিও রয়েছে। নিচের মিনি ওয়েব বাটনে ক্লিক করেই সব ভিডিও উপভোগ করতে পারবেন।`
  ];
  return defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
}

export async function generateAiReply(
  userMessage: string, 
  userFirstName?: string, 
  chatHistory?: Array<{ role: 'user' | 'bot'; text: string }>
): Promise<string> {
  const settings = await getSettings();

  // Pick valid API key
  const apiKey = (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) || 
                 (settings.geminiApiKey && settings.geminiApiKey.trim()) || 
                 "";

  if (!apiKey) {
    return getSmartFallback(userMessage, userFirstName);
  }

  const botHandle = settings.botUsername || 'mariya_2Bot';
  const systemInstruction = (settings.aiSystemPrompt && settings.aiSystemPrompt.trim()) || `You are the official conversational AI representative of @${botHandle}.
Language: Natural Bengali (বাংলা).

CORE BEHAVIOR & RULES:
1. ইউজার যে বিষয়েই কথা বলুক বা প্রশ্ন করুক (লেখাপড়া, বিজ্ঞান, হাই/হ্যালো, গল্প, আবহাওয়া, দিনকাল বা যেকোনো সাধারণ বিষয়), প্রথমে আন্তরিক ও বুদ্ধিমানভাবে ১-২ বাক্যে তার কথার প্রাসঙ্গিক উত্তর দিন। কখনোই ইউজারের কথা উপেক্ষা করে সরাসরি কপি-পেস্ট রোবটের মতো উত্তর দেবেন না।
2. যদি ইউজার সরাসরি ভিডিও সম্পর্কে জানতে চায় (যেমন: কি ভিডিও আছে, টিকটক আছে কিনা, মুভি আছে কিনা):
   বলুন: "আমাদের মিনি ওয়েবের মধ্যে সকল ধরনের বাংলাদেশী ভিডিও ও টিকটকারদের নতুন ভিডিও পাওয়া যায়। নিচের মিনি ওয়েব বাটনে ক্লিক করলেই সব ভিডিও সরাসরি দেখতে পারবেন।"
3. যদি ইউজার বলে ভিডিও খুঁজে পাচ্ছে না বা কোথায় সার্চ করবে:
   বলুন: "আমাদের মিনি ওয়েবের ওপরে সার্চ ইঞ্জিন অপশনে সার্চ করলেই আশা করি আপনার কাঙ্ক্ষিত ভিডিওটি পেয়ে যাবেন।"
4. অন্যান্য সাধারণ কথার ক্ষেত্রে:
   - প্রথমাংশ: ইউজারের কথার সুন্দর, মানবিক ও আন্তরিক উত্তর দিন।
   - শেষাংশ: অবশ্যই উল্লেখ করুন যে আমাদের মিনি ওয়েবের মধ্যে সকল ধরনের ভিডিও পাওয়া যায় এবং নিচের মিনি ওয়েব বাটনে ক্লিক করে মিনি ওয়েবে প্রবেশ করার জন্য আমন্ত্রণ জানান।
5. খুব গুরুত্বপূর্ণ: আপনার উত্তরের ভেতরে কোনো কাঁচা http:// বা https:// ওয়েব লিঙ্ক লিখবেন না। কারণ প্রতিটা মেসেজের নিচে অলরেডি মিনি ওয়েবের বাটন যুক্ত রয়েছে।`;

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const contents: any[] = [];

    if (chatHistory && chatHistory.length > 0) {
      const recent = chatHistory.slice(-4);
      for (const msg of recent) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ 
        text: userFirstName ? `User (${userFirstName}) says: ${userMessage}` : userMessage 
      }]
    });

    // Primary fast models: gemini-3.1-flash-lite is fastest and avoids 429 quota exhaustion
    const modelCandidates = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];
    let reply = "";

    for (const modelName of modelCandidates) {
      if (isModelCoolingDown(modelName)) {
        continue;
      }

      try {
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('AI generation timeout')), 10000)
        );

        const generatePromise = ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 250,
          },
        });

        const response: any = await Promise.race([generatePromise, timeoutPromise]);
        reply = response.text?.trim() || "";
        if (reply) break;
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const isQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded');
        if (isQuota) {
          setModelCooldown(modelName, 60000); // 1-minute cooldown for rate-limited model
        }
      }
    }

    if (!reply) {
      return getSmartFallback(userMessage, userFirstName);
    }

    // Strip any accidental URLs from message text since buttons are attached
    reply = reply.replace(/https?:\/\/\S+/gi, '').replace(/\s+/g, ' ').trim();

    return reply || getSmartFallback(userMessage, userFirstName);
  } catch (error: any) {
    return getSmartFallback(userMessage, userFirstName);
  }
}
