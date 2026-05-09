import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

function generateBadgeSVG(status: 'verified' | 'warning' | 'vulnerable' | 'unknown', score?: number | null): string {
  const configs = {
    verified: {
      leftColor: '#10b981',
      rightColor: '#059669',
      text: 'VERIFIED',
      textColor: '#ffffff',
    },
    warning: {
      leftColor: '#f59e0b',
      rightColor: '#d97706',
      text: 'WARNING',
      textColor: '#ffffff',
    },
    vulnerable: {
      leftColor: '#ef4444',
      rightColor: '#dc2626',
      text: 'VULNERABLE',
      textColor: '#ffffff',
    },
    unknown: {
      leftColor: '#64748b',
      rightColor: '#475569',
      text: 'UNKNOWN',
      textColor: '#ffffff',
    },
  };

  const cfg = configs[status];
  const scoreText = score !== null && score !== undefined ? ` ${score}/100` : '';
  const rightText = cfg.text + scoreText;

  const leftWidth = 90;
  const rightWidth = Math.max(70, rightText.length * 7 + 16);
  const totalWidth = leftWidth + rightWidth;
  const height = 20;
  const radius = 3;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="${height}" role="img" aria-label="HookShield: ${rightText}">
  <title>HookShield: ${rightText}</title>
  <defs>
    <linearGradient id="leftGrad-${status}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${cfg.leftColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${cfg.rightColor};stop-opacity:1" />
    </linearGradient>
    <clipPath id="round-${status}">
      <rect width="${totalWidth}" height="${height}" rx="${radius}" fill="#fff"/>
    </clipPath>
  </defs>
  <g clip-path="url(#round-${status})">
    <rect width="${leftWidth}" height="${height}" fill="url(#leftGrad-${status})"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="${height}" fill="${cfg.rightColor}"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="11">
    <text x="45" y="14">HookShield</text>
    <text x="${leftWidth + rightWidth / 2}" y="14" fill="${cfg.textColor}">${rightText}</text>
  </g>
</svg>`;
}

// Public badge endpoint — no auth required (for README embeds)
router.get('/:scanId.svg', async (req, res) => {
  try {
    const scan = await prisma.securityScan.findUnique({
      where: { id: req.params.scanId },
      select: {
        status: true,
        securityScore: true,
        isVulnerable: true,
      },
    });

    if (!scan || scan.status !== 'COMPLETED') {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'no-cache');
      return res.send(generateBadgeSVG('unknown'));
    }

    let status: 'verified' | 'warning' | 'vulnerable';
    if (scan.isVulnerable || (scan.securityScore !== null && scan.securityScore < 70)) {
      status = 'vulnerable';
    } else if (scan.securityScore !== null && scan.securityScore < 90) {
      status = 'warning';
    } else {
      status = 'verified';
    }

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(generateBadgeSVG(status, scan.securityScore));
  } catch {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(generateBadgeSVG('unknown'));
  }
});

export default router;
