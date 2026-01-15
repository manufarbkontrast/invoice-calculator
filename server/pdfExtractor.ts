import { invokeLLM } from "./_core/llm";
import { extractText } from "unpdf";

export interface ExtractedInvoiceData {
  toolName: string;
  companyName: string;
  amount: number; // in cents
  currency: string;
  invoiceDate: Date | null;
  period: string;
}

// Unterstützte Dateitypen
export const SUPPORTED_FILE_TYPES = {
  pdf: ['application/pdf'],
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
};

export function isImageFile(mimeType: string): boolean {
  return SUPPORTED_FILE_TYPES.image.includes(mimeType.toLowerCase());
}

export function isPdfFile(mimeType: string): boolean {
  return SUPPORTED_FILE_TYPES.pdf.includes(mimeType.toLowerCase());
}

/**
 * Download PDF from URL and extract text
 */
async function extractTextFromPdf(pdfUrl: string): Promise<string> {
  const response = await fetch(pdfUrl);
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.status}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const result = await extractText(arrayBuffer);
  
  // Handle different return formats
  let textContent: string;
  if (typeof result.text === 'string') {
    textContent = result.text;
  } else if (Array.isArray(result.text)) {
    textContent = result.text.join('\n');
  } else {
    textContent = String(result.text || '');
  }
  
  console.log("[PDF] Extracted text preview:", textContent.substring(0, 500));
  return textContent;
}

/**
 * Extract invoice data from image using OpenAI Vision
 */
export async function extractInvoiceDataFromImage(imageUrl: string): Promise<ExtractedInvoiceData> {
  try {
    console.log("[Image] Extracting data from image with Vision API...");
    
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert at extracting structured data from invoice images. Extract the tool/service name, company name, amount, currency, invoice date, and billing period from the provided invoice image."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this invoice image and extract the following information:
- toolName: The name of the tool or service (e.g., 'ChatGPT Pro', 'Midjourney Standard')
- companyName: The company providing the service (e.g., 'OpenAI Ireland Limited')
- amount: The total amount as a number (e.g., 192.44 for €192.44)
- currency: The currency code ('EUR' or 'USD')
- invoiceDate: The invoice date in ISO format (YYYY-MM-DD), or empty string if not found
- period: The billing period (e.g., 'Oct 14 - Nov 14, 2025'), or empty string if not found`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "invoice_data",
          strict: true,
          schema: {
            type: "object",
            properties: {
              toolName: {
                type: "string",
                description: "The name of the tool or service"
              },
              companyName: {
                type: "string",
                description: "The company providing the service"
              },
              amount: {
                type: "number",
                description: "The total amount in the original currency"
              },
              currency: {
                type: "string",
                description: "The currency code (EUR, USD)"
              },
              invoiceDate: {
                type: "string",
                description: "The invoice date in ISO format (YYYY-MM-DD)"
              },
              period: {
                type: "string",
                description: "The billing period"
              }
            },
            required: ["toolName", "companyName", "amount", "currency", "invoiceDate", "period"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentString);
    
    console.log("[Image] Vision API response:", parsed);
    
    // Convert amount to cents to avoid decimal issues
    const amountInCents = Math.round(parsed.amount * 100);
    
    // Parse invoice date
    let invoiceDate: Date | null = null;
    if (parsed.invoiceDate && parsed.invoiceDate.trim() !== "") {
      const parsedDate = new Date(parsed.invoiceDate);
      if (!isNaN(parsedDate.getTime())) {
        invoiceDate = parsedDate;
      }
    }

    return {
      toolName: parsed.toolName || "Unknown Tool",
      companyName: parsed.companyName || "Unknown Company",
      amount: amountInCents,
      currency: parsed.currency || "EUR",
      invoiceDate,
      period: parsed.period || "Unknown"
    };
  } catch (error) {
    console.error("Error extracting invoice data from image:", error);
    throw new Error(`Failed to extract invoice data from image: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract invoice data from PDF using LLM
 */
export async function extractInvoiceData(pdfUrl: string): Promise<ExtractedInvoiceData> {
  try {
    // First extract text from PDF
    console.log("[PDF] Extracting text from PDF...");
    const pdfText = await extractTextFromPdf(pdfUrl);
    console.log("[PDF] Text extracted, length:", pdfText.length);
    
    if (!pdfText || (typeof pdfText === 'string' && pdfText.trim().length === 0)) {
      throw new Error("Could not extract text from PDF");
    }
    
    // Then use LLM to parse the text
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert at extracting structured data from invoices. Extract the tool/service name, company name, amount, currency, invoice date, and billing period from the provided invoice text."
        },
        {
          role: "user",
          content: `Extract the following information from this invoice text:

${pdfText.substring(0, 8000)}

Return the data as JSON with these fields:
- toolName: The name of the tool or service (e.g., 'ChatGPT Pro', 'Midjourney Standard')
- companyName: The company providing the service (e.g., 'OpenAI Ireland Limited')
- amount: The total amount as a number (e.g., 192.44 for €192.44)
- currency: The currency code ('EUR' or 'USD')
- invoiceDate: The invoice date in ISO format (YYYY-MM-DD), or empty string if not found
- period: The billing period (e.g., 'Oct 14 - Nov 14, 2025'), or empty string if not found`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "invoice_data",
          strict: true,
          schema: {
            type: "object",
            properties: {
              toolName: {
                type: "string",
                description: "The name of the tool or service"
              },
              companyName: {
                type: "string",
                description: "The company providing the service"
              },
              amount: {
                type: "number",
                description: "The total amount in the original currency"
              },
              currency: {
                type: "string",
                description: "The currency code (EUR, USD)"
              },
              invoiceDate: {
                type: "string",
                description: "The invoice date in ISO format (YYYY-MM-DD)"
              },
              period: {
                type: "string",
                description: "The billing period"
              }
            },
            required: ["toolName", "companyName", "amount", "currency", "invoiceDate", "period"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentString);
    
    console.log("[PDF] LLM response:", parsed);
    
    // Convert amount to cents to avoid decimal issues
    const amountInCents = Math.round(parsed.amount * 100);
    
    // Parse invoice date
    let invoiceDate: Date | null = null;
    if (parsed.invoiceDate && parsed.invoiceDate.trim() !== "") {
      const parsedDate = new Date(parsed.invoiceDate);
      if (!isNaN(parsedDate.getTime())) {
        invoiceDate = parsedDate;
      }
    }

    return {
      toolName: parsed.toolName || "Unknown Tool",
      companyName: parsed.companyName || "Unknown Company",
      amount: amountInCents,
      currency: parsed.currency || "EUR",
      invoiceDate,
      period: parsed.period || "Unknown"
    };
  } catch (error) {
    console.error("Error extracting invoice data:", error);
    throw new Error(`Failed to extract invoice data: ${error instanceof Error ? error.message : String(error)}`);
  }
}
