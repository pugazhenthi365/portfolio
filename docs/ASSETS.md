# Assets, placeholders and content to review

## Inventory (inspected 22 Nov 2026)

The connected folder `D:\Portfolio of pugazh` was **empty** at the start of the project, so the assets below came from the chat attachments.

| Asset | Source | Location in the app | Status |
|---|---|---|---|
| Professional photograph (963×1280 JPEG) | Supplied by Pugazhenthi | `public/images/profile/pugazhenthi-r.jpg` | ✅ Real photo, used unaltered (cropped only by CSS `object-position` in the hero) |
| Resume PDF (`Pugazhenthi_R_Resume.pdf`) | Supplied by Pugazhenthi | `public/documents/Pugazhenthi_R_Resume.pdf` | ✅ Served through `/resume`. Replace any time in Admin → Resume |
| HEXZORU H symbol, wordmark, round logo | Not supplied | — | ⚠️ **Missing.** No logo was recreated or approximated. The favicon is a neutral “PR” monogram (`src/app/icon.svg`). If you'd like the H symbol as the favicon, add it as `src/app/icon.png` (and remove `icon.svg`) |
| Project screenshots | Not supplied | — | ⚠️ **Missing.** Each project shows a generated **typographic cover** (title, category and stack on a subtle grid). It's flagged in the dashboard (“uses a typographic cover”), in the admin project list (“no cover image”) and through the `data-placeholder-cover="true"` attribute in the HTML. Upload real covers in Admin → Projects |
| Open Graph image | Generated | `src/app/opengraph-image.tsx` | ✅ Built from profile data at runtime |

None of the original files were renamed, overwritten or deleted. They were copied into `public/`.

## Content decisions to review

1. **“Zahi Tech” vs “Zhahi Tech”:** the brief says *Zahi*; the resume says *Zhahi* (twice). The site uses **Zhahi** (resume spelling). Change it in Admin → Projects / Certifications if needed.
2. **Facts from the resume:**
   - experience dates and role progression at Mani India Technologies (Intern Feb–Aug 2025 → On-Job Trainee, System Analyst Sep 2025–Feb 2026 → Junior Software Engineer Mar 2026–present)
   - the Drytis, Inc. freelance contract (Apr 2026–present, including the resume's "6 client projects, 5-star ratings" line)
   - GPA 8.17 and years 2021–2025
   - the IIT Bombay FOSSEE Mapathon 2023 and MERN certification
   - All of these are editable or hideable.
3. **Training Center Management System** (from the resume) was added as a **draft**, not published. Publish it from the CMS if you want it shown.
4. **Project statuses** not stated in the brief were set conservatively: QR Ordering and EduTech = *Completed*, Smart Academic Portal = *Concept*, Mr. Prathas = *Live*, Power Platform = *Ongoing*, AI Resume Optimizer = *Development paused*. Please confirm.
5. **Case-study copy** (problem, solution, contribution) is deliberately modest and claims no metrics, clients or results. Expand it with real details. Add live and GitHub URLs, which were not supplied.
6. **Skills:** the site uses exactly the list from the brief. Your resume also lists Power Fx, SharePoint, Copilot Studio, Power BI, Azure DevOps, Postman, Mongoose and Bootstrap. Add them in Admin → Skills if you want.
7. **Phone number:** it's on the resume but intentionally **not** shown on the website, for privacy.
8. **Availability:** “Available to join from 1 December 2026” is pre-filled but **switched off**. Enable it in Admin → Profile.

## Recommended image specs

- **Cover images:** 1600×1100 (16:11) or 1920×1080, WebP or AVIF, under 500 KB.
- **Screenshots:** up to 2000 px wide, under 800 KB.
- **Profile photo:** portrait 4:5, at least 1000 px wide. A plainer background works best at small sizes.
