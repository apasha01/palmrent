/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import puppeteer from "puppeteer-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function detectChromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ].filter(Boolean) as string[];

  return candidates[0] || "";
}

export async function GET(request: NextRequest) {
  const rentId = request.nextUrl.searchParams.get("rent_id");
  if (!rentId) {
    return Response.json({ message: "rent_id is required" }, { status: 400 });
  }

  const origin = request.nextUrl.origin;
  const url = `${origin}/voucher/${rentId}`;

  const executablePath = detectChromePath();
  if (!executablePath) {
    return Response.json(
      { message: "Chrome/Chromium not found. Set CHROME_PATH.", rentId, url },
      { status: 500 }
    );
  }

  let browser: any = null;

  try {
    browser = await puppeteer.launch({
      executablePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true, // ✅ تایپ درست (headless جدید)
    });

    const page = await browser.newPage();

    // اگر ووچر با سشن کار می‌کند (لاگین)
    const cookie = request.headers.get("cookie");
    if (cookie) await page.setExtraHTTPHeaders({ cookie });

    await page.emulateMediaType("print");

    const navRes = await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 60_000,
    });

    if (!navRes || !navRes.ok()) {
      throw new Error(`Voucher page failed: ${navRes?.status()} ${navRes?.statusText()}`);
    }

    // ✅ جایگزین مطمئن برای waitForTimeout:
    // صبر کن تا body واقعاً رندر شده و چیزی داخل صفحه هست
    await page.waitForFunction(
      () => document.readyState === "complete" && (document.body?.innerText?.length || 0) > 0,
      { timeout: 15_000 }
    );

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    });

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="voucher-${rentId}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("VOUCHER_PDF_ERROR:", e?.message || e, { rentId, url });

    return Response.json(
      {
        message: e?.message || "Failed to generate PDF",
        rentId,
        url,
      },
      { status: 500 }
    );
  } finally {
    if (browser) await browser.close();
  }
}
