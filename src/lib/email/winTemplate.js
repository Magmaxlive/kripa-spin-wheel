function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[char]);
}

function renderWinEmail({ name, giftName, logoUrl }) {
    const safeName = escapeHtml(name || "there");
    const safeGift = escapeHtml(giftName || "a prize");
    const safeLogoUrl = logoUrl ? escapeHtml(logoUrl) : "";

    const subject = `Congratulations, you won ${giftName}!`;

    const preheader = `You've won ${giftName} in Kripa's Spin & Win.`;

    const logoBlock = safeLogoUrl
        ? `
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
                                <tr>
                                    <td style="background-color:#ffffff; border-radius:12px; padding:12px 16px;">
                                        <img src="${safeLogoUrl}" alt="Kripa" width="120" style="display:block; width:120px; height:auto; max-width:120px; border:0; outline:none; text-decoration:none;" />
                                    </td>
                                </tr>
                            </table>`
        : "";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0; padding:0; background-color:#f8f6f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#1a1a1a; -webkit-font-smoothing:antialiased;">
    <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; visibility:hidden; opacity:0; color:transparent;">
        ${escapeHtml(preheader)}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f6f2;">
        <tr>
            <td align="center" style="padding:32px 16px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; background-color:#ffffff; border-radius:16px; overflow:hidden;">
                    <tr>
                        <td style="background-color:#004539; padding:32px;">${logoBlock}
                            <p style="margin:0; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#d5ad67; font-weight:600;">
                                Spin &amp; Win
                            </p>
                            <h1 style="margin:10px 0 0; font-size:26px; line-height:1.3; font-weight:700; color:#ffffff;">
                                Congratulations, ${safeName}!
                            </h1>
                            <p style="margin:8px 0 0; font-size:15px; line-height:1.5; color:rgba(255,255,255,0.85);">
                                Your spin landed on a prize.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#4a4a4a;">
                                Thanks for taking part in our campaign. We're thrilled to confirm that you've won the following prize:
                            </p>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
                                <tr>
                                    <td style="border:1px solid rgba(0,69,57,0.15); border-radius:14px; padding:28px 24px; background-color:#fdfbf7; text-align:center;">
                                        <p style="margin:0 0 10px; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#6b6b6b; font-weight:600;">
                                            Your prize
                                        </p>
                                        <p style="margin:0; font-size:24px; line-height:1.3; font-weight:700; color:#004539;">
                                            ${safeGift}
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:0 0 10px; font-size:15px; font-weight:600; color:#004539;">
                                What happens next
                            </p>
                            <p style="margin:0 0 24px; font-size:14px; line-height:1.6; color:#4a4a4a;">
                                Please keep this email as proof of your win. Our team will be in touch shortly to arrange delivery or pickup of your prize.
                            </p>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
                                <tr>
                                    <td style="border-top:1px solid #eee; height:1px; font-size:0; line-height:0;">&nbsp;</td>
                                </tr>
                            </table>

                            <p style="margin:0; font-size:13px; line-height:1.6; color:#8a8a8a;">
                                Questions? Just reply to this email and we'll help.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:20px 32px; background-color:#f8f6f2; text-align:center;">
                            <p style="margin:0 0 4px; font-size:12px; color:#8a8a8a;">
                                Thank you for participating in Kripa's Spin &amp; Win.
                            </p>
                            <p style="margin:0; font-size:11px; color:#b5b5b5;">
                                This email was sent because you spun the wheel and won.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    const text = [
        `Congratulations, ${name || "there"}!`,
        ``,
        `You've won: ${giftName || "a prize"}`,
        ``,
        `Thanks for taking part in Kripa's Spin & Win campaign.`,
        ``,
        `What happens next:`,
        `Please keep this email as proof of your win. Our team will be in touch shortly to arrange delivery or pickup of your prize.`,
        ``,
        `Questions? Just reply to this email and we'll help.`,
        ``,
        `— Kripa Spin & Win`,
    ].join("\n");

    return { subject, html, text };
}

export { renderWinEmail };
