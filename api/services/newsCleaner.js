import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Tải và làm sạch nội dung HTML của bài báo
 * @param {string} url - Link bài báo cần quét
 * @returns {Promise<{title: string, cleanedText: string, cleanedHtml: string}>}
 */
export async function cleanArticle(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Không thể truy cập bài viết (Mã lỗi: ${response.status})`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Loại bỏ các thẻ không liên quan, quảng cáo
    $(
      'script, style, noscript, iframe, header, footer, nav, aside, svg, form, input, button, select, textarea, img, video, audio'
    ).remove();
    $(
      '#footer, .footer, #header, .header, #sidebar, .sidebar, #nav, .nav, .menu, #menu, .ads, .advertisement, .comment, #comment, .sharing, .social-share, .related-posts, .tags'
    ).remove();

    // Trích xuất tiêu đề bài báo
    let title = $('h1').first().text().trim();
    if (!title) {
      title = $('title').text().trim();
    }
    if (title.includes(' - ')) {
      title = title.split(' - ')[0].trim();
    } else if (title.includes(' | ')) {
      title = title.split(' | ')[0].trim();
    }

    // Trích xuất các thẻ chính: p, h1, h2, h3
    const contentElements = $('p, h1, h2, h3');
    const paragraphs = [];
    const htmlParts = [];

    contentElements.each((i, el) => {
      const tagName = el.name;
      const text = $(el).text().trim();

      if (text.length > 20) {
        paragraphs.push(text);
        if (tagName.startsWith('h')) {
          htmlParts.push(`<${tagName} class="text-xl font-bold mt-6 mb-2 text-indigo-300">${text}</${tagName}>`);
        } else {
          htmlParts.push(`<p class="mb-4 text-gray-300 leading-relaxed text-base">${text}</p>`);
        }
      }
    });

    const cleanedText = paragraphs.join('\n\n');
    const cleanedHtml = htmlParts.join('\n');

    if (!cleanedText) {
      throw new Error('Không thể tìm thấy nội dung bài viết phù hợp để làm sạch.');
    }

    return {
      title,
      cleanedText,
      cleanedHtml
    };
  } catch (error) {
    console.error('Lỗi trong dịch vụ cleanArticle:', error);
    throw error;
  }
}

/**
 * Gửi nội dung đã làm sạch tới LLM để tóm tắt và phân tích học tiếng Anh
 * @param {string} title - Tiêu đề bài viết
 * @param {string} content - Nội dung bài báo sạch (text)
 * @returns {Promise<object>} - JSON kết quả từ LLM
 */
export async function summarizeWithAI(title, content) {
  const prompt = `Bạn là một "AI Cleaner News" xuất sắc. Nhiệm vụ của bạn là đọc và phân tích bài báo có tiêu đề "${title}" với nội dung bên dưới.
Nội dung bài báo:
"""
${content}
"""

Hãy xử lý và trả về một chuỗi JSON duy nhất đại diện cho kết quả phân tích. Cấu trúc JSON bắt buộc phải khớp hoàn toàn với mẫu sau:
{
  "success": true,
  "summary_vi": "Tóm tắt ngắn gọn, mạch lạc bằng tiếng Việt trong khoảng 3-4 câu.",
  "summary_en": "Tóm tắt ngắn gọn, mạch lạc bằng tiếng Anh tương đương trong khoảng 3-4 câu.",
  "bullets": [
    "Ý chính quan trọng thứ nhất của bài báo",
    "Ý chính quan trọng thứ hai của bài báo",
    "Ý chính quan trọng thứ ba của bài báo (thêm tối đa 2 ý nữa nếu cần thiết)"
  ],
  "phrases_english": [
    {
      "original": "Cụm từ tiếng Anh nổi bật hoặc idiom xuất hiện trong bài hoặc liên quan chặt chẽ",
      "meaning": "Giải nghĩa cụm từ đó bằng tiếng Việt ngắn gọn",
      "example": "Đặt một câu ví dụ tiếng Anh có chứa cụm từ đó (và bôi đậm cụm từ đó)"
    }
  ]
}

LƯU Ý QUAN TRỌNG:
1. Hãy lọc ra ít nhất 3-5 cụm từ tiếng Anh / idiom hữu ích từ bài báo (hoặc dịch các thuật ngữ quan trọng trong bài nếu bài báo viết bằng tiếng Việt).
2. Hãy chỉ trả về JSON hợp lệ. Không viết thêm bất kỳ lời thoại nào trước hoặc sau JSON. Không dùng markdown block nếu có thể.`;

  const beeknoeeKey = process.env.BEEKNOEE_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const openAIKey = process.env.OPENAI_API_KEY;

  // 0. CHẠY BEEKNOEE AI API (ĐỘNG CƠ ƯU TIÊN SỐ 1 - HÀNG RÀO BẢO VỆ CHÍNH)
  if (beeknoeeKey && beeknoeeKey.trim() !== '' && beeknoeeKey !== 'your_beeknoee_api_key_here') {
    console.log('--- Đang gọi Beeknoee AI API để xử lý bài báo... ---');
    
    // Thử tuần tự các mô hình Beeknoee theo thứ tự ưu tiên
    const beeknoeeModels = [
      'glm-4.5-flash',
      'glm-4.7-flash',
      'llama3.1-8b',
      'qwen-3-235b-a22b-instruct-2507'
    ];
    let responseText = null;
    let beeknoeeError = null;

    for (const modelName of beeknoeeModels) {
      try {
        console.log(`🤖 Đang thử gọi Beeknoee bằng mô hình: "${modelName}"...`);
        const response = await fetch('https://platform.beeknoee.com/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${beeknoeeKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1500
          })
        });

        if (response.ok) {
          const result = await response.json();
          responseText = result.choices[0].message.content;
          console.log(`✅ Gọi thành công Beeknoee bằng mô hình: "${modelName}"`);
          break;
        } else {
          const errData = await response.text();
          console.warn(`⚠️ Beeknoee model "${modelName}" thất bại:`, errData);
          beeknoeeError = new Error(errData);
        }
      } catch (err) {
        console.warn(`⚠️ Lỗi kết nối Beeknoee model "${modelName}":`, err.message);
        beeknoeeError = err;
      }
    }

    if (responseText) {
      try {
        return parseAIResponse(responseText);
      } catch (parseErr) {
        console.error('Lỗi khi parse phản hồi từ Beeknoee:', parseErr);
      }
    } else {
      console.error('Tất cả mô hình Beeknoee đều lỗi hoặc không phản hồi. Chuyển sang động cơ dự phòng tiếp theo...');
    }
  }

  // 1. CHẠY GEMINI API (NẾU CÓ KEY VỚI CƠ CHẾ KHÁNG LỖI ĐA MODEL)
  if (geminiKey && geminiKey.trim() !== '' && geminiKey !== 'your_gemini_api_key_here') {
    console.log('--- Đang gọi Gemini API để xử lý bài báo... ---');
    
    const modelsToTry = [
      'gemini-1.5-flash-latest', 
      'gemini-1.5-flash', 
      'gemini-pro',
      'gemini-1.5-pro'
    ];
    
    let responseText = null;
    let apiError = null;

    const genAI = new GoogleGenerativeAI(geminiKey);

    for (const modelName of modelsToTry) {
      try {
        console.log(`🤖 Đang thử gọi mô hình Gemini: "${modelName}"...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const response = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          }
        });

        responseText = response.response.text();
        if (responseText) {
          console.log(`✅ Gọi thành công bằng mô hình: "${modelName}"`);
          break;
        }
      } catch (err) {
        console.warn(`⚠️ Mô hình "${modelName}" báo lỗi: ${err.message}`);
        apiError = err;
      }
    }

    if (responseText) {
      try {
        return parseAIResponse(responseText);
      } catch (parseErr) {
        console.error('Lỗi khi parse phản hồi của Gemini API:', parseErr);
      }
    } else {
      console.error('Tất cả mô hình Gemini đều lỗi. Lỗi cuối cùng:', apiError);
    }
  }

  // 2. CHẠY GROQ API (100% MIỄN PHÍ - SIÊU TỐC ĐỘ LPU)
  if (groqKey && groqKey.trim() !== '' && groqKey !== 'your_groq_api_key_here') {
    console.log('--- Đang gọi Groq API (Free Tier) để xử lý bài báo... ---');
    
    // Thử tuần tự Gemma 2 và Llama 3 miễn phí của Groq
    const groqModels = ['gemma2-9b-it', 'llama-3.3-70b-versatile', 'llama3-8b-8192'];
    let responseText = null;
    
    for (const modelName of groqModels) {
      try {
        console.log(`🤖 Đang thử gọi Groq bằng mô hình: "${modelName}"...`);
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
          })
        });

        if (response.ok) {
          const result = await response.json();
          responseText = result.choices[0].message.content;
          console.log(`✅ Gọi thành công Groq bằng mô hình: "${modelName}"`);
          break;
        } else {
          const errData = await response.text();
          console.warn(`⚠️ Groq model "${modelName}" thất bại:`, errData);
        }
      } catch (err) {
        console.warn(`⚠️ Lỗi kết nối Groq model "${modelName}":`, err.message);
      }
    }

    if (responseText) {
      try {
        return parseAIResponse(responseText);
      } catch (parseErr) {
        console.error('Lỗi khi parse phản hồi từ Groq:', parseErr);
      }
    }
  }

  // 3. CHẠY OPENROUTER API (DANH SÁCH AI MIỄN PHÍ CỰC MẠNH)
  if (openrouterKey && openrouterKey.trim() !== '' && openrouterKey !== 'your_openrouter_api_key_here') {
    console.log('--- Đang gọi OpenRouter API (Free Models) để xử lý bài báo... ---');
    
    const openrouterModels = [
      'google/gemma-2-9b-it:free', 
      'meta-llama/llama-3-8b-instruct:free',
      'mistralai/mistral-7b-instruct:free'
    ];
    let responseText = null;

    for (const modelName of openrouterModels) {
      try {
        console.log(`🤖 Đang thử gọi OpenRouter bằng mô hình Free: "${modelName}"...`);
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/venhladamz-star/ai-news-cleaner',
            'X-Title': 'AI News Curated'
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
          })
        });

        if (response.ok) {
          const result = await response.json();
          responseText = result.choices[0].message.content;
          console.log(`✅ Gọi thành công OpenRouter bằng mô hình: "${modelName}"`);
          break;
        } else {
          const errData = await response.text();
          console.warn(`⚠️ OpenRouter model "${modelName}" thất bại:`, errData);
        }
      } catch (err) {
        console.warn(`⚠️ Lỗi kết nối OpenRouter model "${modelName}":`, err.message);
      }
    }

    if (responseText) {
      try {
        return parseAIResponse(responseText);
      } catch (parseErr) {
        console.error('Lỗi khi parse phản hồi từ OpenRouter:', parseErr);
      }
    }
  }

  // 4. CHẠY OPENAI API (NẾU CÓ KEY VÀ KHÔNG DÙNG CÁC PHƯƠNG ÁN TRÊN)
  if (openAIKey && openAIKey.trim() !== '' && openAIKey !== 'your_openai_api_key_here') {
    console.log('--- Đang gọi OpenAI API để xử lý bài báo... ---');
    try {
      const openai = new OpenAI({ apiKey: openAIKey });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });

      const responseText = completion.choices[0].message.content;
      return parseAIResponse(responseText);
    } catch (apiError) {
      console.error('Lỗi khi gọi OpenAI API:', apiError);
    }
  }

  // 5. MOCK MODE (NẾU KHÔNG CÓ API KEY HOẶC CÁC PHƯƠNG ÁN TRÊN ĐỀU LỖI)
  console.log('--- Đang chạy ở MOCK MODE (Không có API Key hoạt động) ---');
  return generateMockResponse(title, content);
}

/**
 * Parse kết quả chuỗi JSON trả về từ AI một cách an toàn
 */
function parseAIResponse(text) {
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();
    
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Lỗi khi parse JSON của AI:', error);
    throw new Error('Dữ liệu trả về từ AI không đúng cấu trúc JSON yêu cầu.');
  }
}

/**
 * Tạo dữ liệu Mock chân thực cho việc test UI mượt mà
 */
function generateMockResponse(title, content) {
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
  const firstParagraph = paragraphs[0] || 'Nội dung bài viết đang được tóm tắt.';
  const secondParagraph = paragraphs[1] || 'Thông tin bổ sung đang được trích xuất.';

  return {
    success: true,
    summary_vi: `[MOCK MODE] Bài viết "${title}" thảo luận về các vấn đề trọng tâm và diễn biến mới nhất. Nội dung chính tập trung phân tích bối cảnh xung quanh chủ đề này, đưa ra các đánh giá và nhận định sâu sắc của chuyên gia nhằm giúp người đọc hiểu toàn cảnh vấn đề một cách nhanh chóng.`,
    summary_en: `[MOCK MODE] The article "${title}" discusses the core issues and latest developments. The main content focuses on analyzing the context surrounding this topic, offering deep expert evaluations and insights to help readers quickly understand the full picture.`,
    bullets: [
      `Tiêu đề bài viết nổi bật: "${title}".`,
      `Điểm bắt đầu: ${firstParagraph.substring(0, 120)}...`,
      `Khía cạnh tiếp theo được nhắc tới: ${secondParagraph.substring(0, 120)}...`,
      `Ứng dụng AI News Cleaner hoạt động hoàn hảo và sẵn sàng kết nối API Key thật.`
    ],
    phrases_english: [
      {
        original: "cutting-edge technology",
        meaning: "công nghệ tiên tiến hàng đầu",
        example: "This app represents the **cutting-edge technology** in automated news reading."
      },
      {
        original: "to wrap up",
        meaning: "tóm tắt lại, hoàn thành",
        example: "The AI helper will **wrap up** the long article into key bullet points."
      },
      {
        original: "highly sophisticated",
        meaning: "cực kỳ tinh vi, phức tạp và cao cấp",
        example: "The cleaner service uses a **highly sophisticated** scraping algorithm to parse HTML."
      },
      {
        original: "keep an eye on",
        meaning: "để mắt tới, chú ý theo dõi",
        example: "Language learners should **keep an eye on** common English phrases inside everyday news articles."
      }
    ]
  };
}
