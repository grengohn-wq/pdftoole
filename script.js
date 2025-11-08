// script.js - منطقيات الواجهة والتعامل مع pdf-lib

const { PDFDocument } = PDFLib;
// إعداد عامل PDF.js لاستخراج النصوص
if(window['pdfjsLib']){
  try{ pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js'; }catch(e){ console.warn('pdfjs worker setup failed', e); }
}

// عناصر DOM
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');
const comingSoonTabs = document.querySelectorAll('.tab.coming-soon');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const rangesInput = document.getElementById('rangesInput');
const extractBtn = document.getElementById('extractBtn');
const errorDiv = document.getElementById('error');
const resultDiv = document.getElementById('result');

// عناصر التقسيم والدمج
const splitFileInput = document.getElementById('splitFileInput');
const splitFileInfo = document.getElementById('splitFileInfo');
const splitEveryChk = document.getElementById('splitEveryChk');
const splitRangesInput = document.getElementById('splitRangesInput');
const splitBtn = document.getElementById('splitBtn');
const splitError = document.getElementById('splitError');
const splitResult = document.getElementById('splitResult');

const mergeFilesInput = document.getElementById('mergeFilesInput');
const mergeFilesInfo = document.getElementById('mergeFilesInfo');
const mergeBtn = document.getElementById('mergeBtn');
const mergeError = document.getElementById('mergeError');
const mergeResult = document.getElementById('mergeResult');

// عناصر PDF->Word و Edit و Image->PDF
const pdf2wordInput = document.getElementById('pdf2wordInput');
const pdf2wordInfo = document.getElementById('pdf2wordInfo');
const pdf2wordBtn = document.getElementById('pdf2wordBtn');
const pdf2wordError = document.getElementById('pdf2wordError');
const pdf2wordResult = document.getElementById('pdf2wordResult');

const editFileInput = document.getElementById('editFileInput');
const editFileInfo = document.getElementById('editFileInfo');
const pagesList = document.getElementById('pagesList');
const applyEditBtn = document.getElementById('applyEditBtn');
const editError = document.getElementById('editError');
const editResult = document.getElementById('editResult');

const imgFilesInput = document.getElementById('imgFilesInput');
const imgFilesInfo = document.getElementById('imgFilesInfo');
const fitToPageChk = document.getElementById('fitToPageChk');
const img2pdfBtn = document.getElementById('img2pdfBtn');
const img2pdfError = document.getElementById('img2pdfError');
const img2pdfResult = document.getElementById('img2pdfResult');
// عناصر التقدم والثيم
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const themeToggle = document.getElementById('themeToggle');
const adPreviewToggle = document.getElementById('adPreviewToggle');

// Admin modal elements
const adminModal = document.getElementById('adminModal');
const adminPasswordInput = document.getElementById('adminPassword');
const adminCancelBtn = document.getElementById('adminCancel');
const adminSubmitBtn = document.getElementById('adminSubmit');
const adminMsg = document.getElementById('adminMsg');
 
// Page editor elements (full-screen click-to-edit)
const pageEditorModal = document.getElementById('pageEditorModal');
const editorCanvas = document.getElementById('editorCanvas');
const editorOverlays = document.getElementById('editorOverlays');
const editorSave = document.getElementById('editorSave');
const editorClose = document.getElementById('editorClose');

// Admin password (kept only in code, not shown). User provided: mosap@123123
const ADMIN_PASSWORD = 'mosap@123123';

let currentPdfArrayBuffer = null;
let currentPdfDoc = null;
let currentFileName = '';
let currentPageCount = 0;

// تبويبات
tabs.forEach(tab=>{
  tab.addEventListener('click',()=>{
    if(tab.disabled) return;
    tabs.forEach(t=>t.classList.remove('active'));
    panels.forEach(p=>p.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.target;
    const panel = document.getElementById(target);
    if(panel) panel.classList.add('active');
    // مسح رسائل سابقة
    clearMessages();
  });
});

// عند المرور على التبويبات المعطلة - إظهار رسالة تنبيهية صغيرة
function showToast(text){
  let t = document.querySelector('.toast');
  if(!t){
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = text;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2500);
}

comingSoonTabs.forEach(t=>{
  t.addEventListener('mouseenter',()=>{ showToast('هذه الأداة قيد التطوير وستكون متاحة قريباً!'); });
});

// التعامل مع اختيار الملف
fileInput.addEventListener('change', async (e)=>{
  clearMessages();
  resultDiv.innerHTML = '';
  const file = e.target.files && e.target.files[0];
  if(!file){
    fileInfo.textContent = 'لم يتم اختيار ملف بعد.';
    currentPdfArrayBuffer = null;
    currentPdfDoc = null;
    currentFileName = '';
    currentPageCount = 0;
    return;
  }

  if(file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')){
    showError('الرجاء اختيار ملف PDF أولاً.');
    fileInput.value = '';
    return;
  }

  currentFileName = file.name;
  try{
    const arrayBuffer = await file.arrayBuffer();
    currentPdfArrayBuffer = arrayBuffer;
    currentPdfDoc = await PDFDocument.load(arrayBuffer);
    currentPageCount = currentPdfDoc.getPageCount();
    fileInfo.textContent = `تم اختيار الملف: ${currentFileName} - عدد الصفحات: ${currentPageCount}`;
  }catch(err){
    console.error(err);
    showError('تعذر قراءة ملف PDF. تأكد من أن الملف صالح.');
  }
});

function clearMessages(){
  errorDiv.textContent = '';
  if(splitError) splitError.textContent = '';
  if(mergeError) mergeError.textContent = '';
}
function showError(msg){
  errorDiv.textContent = msg;
}

function showSplitError(msg){ if(splitError) splitError.textContent = msg; }
function showMergeError(msg){ if(mergeError) mergeError.textContent = msg; }
function showPdf2WordError(msg){ if(pdf2wordError) pdf2wordError.textContent = msg; }
function showEditError(msg){ if(editError) editError.textContent = msg; }
function showImg2PdfError(msg){ if(img2pdfError) img2pdfError.textContent = msg; }

// Progress helper
function setProgress(percent, text, show = true){
  if(!progressContainer) return;
  if(show) progressContainer.classList.add('show');
  progressBar.style.width = Math.max(0, Math.min(100, percent)) + '%';
  progressText.textContent = text || '';
  if(percent >= 100){
    setTimeout(()=>{ progressContainer.classList.remove('show'); progressBar.style.width = '0%'; }, 700);
  }
}

// Create download widget with rename field
function createDownloadWidget(blob, defaultName, container){
  const widget = document.createElement('div'); widget.className = 'download-widget';
  const input = document.createElement('input'); input.type = 'text'; input.value = defaultName || 'file.pdf';
  const btn = document.createElement('button'); btn.textContent = 'تحميل';
  const url = URL.createObjectURL(blob);
  btn.addEventListener('click', ()=>{
    const a = document.createElement('a'); a.href = url; a.download = input.value || defaultName || 'file.pdf'; document.body.appendChild(a); a.click(); a.remove();
    // revoke later
    setTimeout(()=>URL.revokeObjectURL(url), 2000);
  });
  widget.appendChild(input); widget.appendChild(btn);
  container.appendChild(widget);
}

// Theme toggle
if(themeToggle){
  themeToggle.addEventListener('click', ()=>{
    document.body.classList.toggle('dark');
    const pressed = document.body.classList.contains('dark');
    themeToggle.setAttribute('aria-pressed', String(pressed));
    themeToggle.textContent = pressed? '☀️' : '🌙';
  });
}

// Ad preview toggle: fills .ad-placeholder with a demo ad for local testing
function fillAdPlaceholders(){
  const placeholders = document.querySelectorAll('.ad-placeholder');
  placeholders.forEach(p=>{
    // skip if already in preview mode
    if(p.classList.contains('ad-preview')) return;
    const orig = p.innerHTML;
    p.dataset._orig = orig;
    p.classList.add('ad-preview');
    p.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:12px">
        <div style="font-weight:800;color:#073b4c">إعلان تجريبي</div>
        <div style="font-size:13px;color:#134e4a">مكان الإعلان - معاينة محلية</div>
        <div style="width:100%;height:60px;background:linear-gradient(90deg,#e6f7ff,#eafbf8);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#044f45;font-weight:700">احصل على نسخة إعلانية</div>
      </div>`;
  });
}

function clearAdPreviews(){
  const placeholders = document.querySelectorAll('.ad-placeholder');
  placeholders.forEach(p=>{
    if(p.classList.contains('ad-preview')){
      p.classList.remove('ad-preview');
      if(p.dataset._orig) p.innerHTML = p.dataset._orig;
    }
  });
}

if(adPreviewToggle){
  adPreviewToggle.addEventListener('click', ()=>{
    const pressed = adPreviewToggle.getAttribute('aria-pressed') === 'true';
    if(pressed){
      clearAdPreviews();
      adPreviewToggle.setAttribute('aria-pressed','false');
      adPreviewToggle.textContent = '📣 معاينة إعلان';
    } else {
      fillAdPlaceholders();
      adPreviewToggle.setAttribute('aria-pressed','true');
      adPreviewToggle.textContent = '✖ إخفاء المعاينة';
    }
  });
}

// Load ad slot IDs from localStorage and apply to ins.adsbygoogle elements
function applyAdSlotsFromStorage(){
  const top = localStorage.getItem('ad_slot_top') || '';
  const middle = localStorage.getItem('ad_slot_middle') || '';
  const article = localStorage.getItem('ad_slot_article') || '';
  const bottom = localStorage.getItem('ad_slot_bottom') || '';
  // map data-ad-position -> slot
  const map = { top, middle, article, bottom };
  document.querySelectorAll('div.ad-slot').forEach(slotDiv=>{
    const pos = slotDiv.dataset.adPosition;
    const ins = slotDiv.querySelector('ins.adsbygoogle');
    if(ins){
      const id = map[pos] || '';
      if(id){
        ins.setAttribute('data-ad-slot', id);
        ins.style.display = 'block';
        // try push adsbygoogle if available
        try{ (adsbygoogle = window.adsbygoogle || []).push({}); }catch(e){}
      } else {
        ins.style.display = 'none';
      }
    }
  });
}

// Apply at load and when storage changes
document.addEventListener('DOMContentLoaded', ()=>{ applyAdSlotsFromStorage(); });
window.addEventListener('storage', (e)=>{ if(e.key === 'ad_config_updated') applyAdSlotsFromStorage(); });

// ------------------ Admin flow (hidden modal, open via Ctrl+Alt+A) ------------------
function openAdminModal(){
  if(!adminModal) return;
  adminModal.setAttribute('aria-hidden','false');
  adminPasswordInput.value = '';
  adminPasswordInput.focus();
  adminMsg.textContent = '';
}
function closeAdminModal(){
  if(!adminModal) return;
  adminModal.setAttribute('aria-hidden','true');
}

// Validate password (simple comparison). Password not printed anywhere.
function checkAdminPassword(input){
  return input === ADMIN_PASSWORD;
}

// When admin submits
if(adminSubmitBtn){
  adminSubmitBtn.addEventListener('click', ()=>{
    const val = adminPasswordInput.value || '';
    if(checkAdminPassword(val)){
      adminMsg.textContent = 'تم التحقق. جاري تفعيل وضع المشرف...';
      // enable demo ads immediately
      fillAdPlaceholders();
      // Also reveal hidden ins.adsbygoogle elements (make them visible as placeholders)
      document.querySelectorAll('ins.adsbygoogle').forEach(ins=>{ ins.style.display = 'block'; });
      setTimeout(()=>{ closeAdminModal(); }, 700);
    } else {
      adminMsg.textContent = 'كلمة المرور غير صحيحة.';
      adminPasswordInput.value = '';
      adminPasswordInput.focus();
    }
  });
}

if(adminCancelBtn){ adminCancelBtn.addEventListener('click', ()=>{ closeAdminModal(); }); }

// Keyboard shortcut Ctrl+Alt+A opens admin modal
document.addEventListener('keydown', (e)=>{
  if(e.ctrlKey && e.altKey && (e.key === 'a' || e.key === 'A')){
    openAdminModal();
  }
});

// Fallback hidden trigger: 5 rapid clicks on the header title opens admin modal
let headerClickCount = 0;
let headerClickTimer = null;
const headerTitle = document.querySelector('header h1');
if(headerTitle){
  headerTitle.addEventListener('click', ()=>{
    headerClickCount++;
    if(headerClickTimer) clearTimeout(headerClickTimer);
    headerClickTimer = setTimeout(()=>{ headerClickCount = 0; }, 3000);
    if(headerClickCount >= 5){
      headerClickCount = 0;
      if(headerClickTimer) clearTimeout(headerClickTimer);
      openAdminModal();
    }
  });
}

// تحليل نطاقات الصفحات من النص
function parseRanges(input, pageCount){
  if(!input || !input.trim()) return null; // سيتم اعتبار فارغ كخطأ
  const parts = input.split(',').map(s=>s.trim()).filter(Boolean);
  const pages = new Set();
  const rangeRegex = /^\d+(?:-\d+)?$/;
  for(const part of parts){
    if(!rangeRegex.test(part)){
      return { error: 'format' };
    }
    if(part.includes('-')){
      const [startS,endS] = part.split('-').map(s=>s.trim());
      const start = parseInt(startS,10);
      const end = parseInt(endS,10);
      if(isNaN(start) || isNaN(end) || start < 1 || end < 1 || start> end){
        return { error: 'format' };
      }
      if(start > pageCount || end > pageCount) return { error: 'outofrange' };
      for(let i=start;i<=end;i++) pages.add(i-1); // صفرية
    } else {
      const p = parseInt(part,10);
      if(isNaN(p) || p < 1) return { error: 'format' };
      if(p > pageCount) return { error: 'outofrange' };
      pages.add(p-1);
    }
  }
  if(pages.size === 0) return { error: 'format' };
  // تحويل إلى مصفوفة مرتبة
  return { pages: Array.from(pages).sort((a,b)=>a-b) };
}

// زر الاستخراج
extractBtn.addEventListener('click', async ()=>{
  clearMessages();
  resultDiv.innerHTML = '';
  if(!currentPdfDoc){
    showError('الرجاء اختيار ملف PDF أولاً.');
    return;
  }
  const input = rangesInput.value;
  const parsed = parseRanges(input, currentPageCount);
  if(!parsed || parsed.error){
    if(parsed && parsed.error === 'outofrange'){
      showError('إحدى الصفحات المطلوبة غير موجودة في الملف.');
    } else {
      showError('صيغة نطاق الصفحات غير صالحة. يرجى استخدام تنسيق مثل: 1-3, 5, 8-10');
    }
    return;
  }

  try{
    extractBtn.disabled = true;
    extractBtn.textContent = 'جاري الاستخراج ...';

    const newPdf = await PDFDocument.create();
    // نحتاج مجددًا لقراءة مصدر PDF لأننا قد نستخدم copyPages من مستند.
    const srcDoc = await PDFDocument.load(currentPdfArrayBuffer);
    const copiedPages = await newPdf.copyPages(srcDoc, parsed.pages);
    copiedPages.forEach(p => newPdf.addPage(p));
    const newBytes = await newPdf.save();

  const blob = new Blob([newBytes], { type: 'application/pdf' });
  // show download widget with rename
  createDownloadWidget(blob, 'المستخرج.pdf', resultDiv);
  setProgress(100, 'اكتمل الاستخراج');

  }catch(err){
    console.error(err);
    showError('حدث خطأ أثناء معالجة الملف. حاول مرة أخرى.');
  }finally{
    extractBtn.disabled = false;
    extractBtn.textContent = 'استخراج الصفحات الآن';
  }
});

// تحسينات UX: مسح الرسائل عند كتابة شيء جديد
rangesInput.addEventListener('input',()=>{ errorDiv.textContent = ''; resultDiv.innerHTML = ''; });

// ------------------ تقسيم PDF ------------------
let splitArrayBuffer = null;
let splitPageCount = 0;
splitFileInput && splitFileInput.addEventListener('change', async (e)=>{
  splitResult.innerHTML = '';
  showSplitError('');
  const file = e.target.files && e.target.files[0];
  if(!file){ splitFileInfo.textContent = 'لم يتم اختيار ملف بعد.'; splitArrayBuffer = null; splitPageCount = 0; return; }
  if(file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')){
    showSplitError('الرجاء اختيار ملف PDF أولاً.'); splitFileInput.value = ''; return;
  }
  try{
    const ab = await file.arrayBuffer();
    splitArrayBuffer = ab;
    const doc = await PDFDocument.load(ab);
    splitPageCount = doc.getPageCount();
    splitFileInfo.textContent = `تم اختيار الملف: ${file.name} - عدد الصفحات: ${splitPageCount}`;
  }catch(err){ console.error(err); showSplitError('تعذر قراءة ملف PDF. تأكد من أن الملف صالح.'); }
});

function parseRangesGroups(input, pageCount){
  if(!input || !input.trim()) return { error: 'empty' };
  const parts = input.split(',').map(s=>s.trim()).filter(Boolean);
  const rangeRegex = /^\d+(?:-\d+)?$/;
  const groups = [];
  for(const part of parts){
    if(!rangeRegex.test(part)) return { error: 'format' };
    if(part.includes('-')){
      const [s,e] = part.split('-').map(x=>parseInt(x.trim(),10));
      if(isNaN(s) || isNaN(e) || s<1 || e<1 || s>e) return { error:'format' };
      if(s>pageCount || e>pageCount) return { error:'outofrange' };
      groups.push({ start: s, end: e });
    } else {
      const p = parseInt(part,10);
      if(isNaN(p) || p<1) return { error:'format' };
      if(p>pageCount) return { error:'outofrange' };
      groups.push({ start: p, end: p });
    }
  }
  return { groups };
}

splitBtn && splitBtn.addEventListener('click', async ()=>{
  splitResult.innerHTML = '';
  showSplitError('');
  if(!splitArrayBuffer){ showSplitError('الرجاء اختيار ملف PDF أولاً.'); return; }
  const zip = new JSZip();
  try{
    splitBtn.disabled = true; splitBtn.textContent = 'جاري التقسيم ...';
    const srcDoc = await PDFDocument.load(splitArrayBuffer);
    if(splitEveryChk && splitEveryChk.checked){
      // كل صفحة ملف مستقل
      for(let i=0;i<splitPageCount;i++){
        const newPdf = await PDFDocument.create();
        const [copied] = await newPdf.copyPages(srcDoc, [i]);
        newPdf.addPage(copied);
        const bytes = await newPdf.save();
        zip.file(`page-${i+1}.pdf`, bytes);
        setProgress(Math.round(((i+1)/splitPageCount)*85), `إنشاء صفحات... ${i+1}/${splitPageCount}`);
      }
      setProgress(90, 'إنشاء الأرشيف (ZIP)...');
      const blob = await zip.generateAsync({ type: 'blob' });
      createDownloadWidget(blob, 'split-pages.zip', splitResult);
      setProgress(100, 'اكتمل التقسيم');
    } else {
      // تقسيم حسب النطاقات
      const input = splitRangesInput.value;
      const parsed = parseRangesGroups(input, splitPageCount);
      if(!parsed || parsed.error){
        if(parsed && parsed.error === 'outofrange') showSplitError('إحدى الصفحات المطلوبة غير موجودة في الملف.');
        else showSplitError('صيغة نطاق الصفحات غير صالحة. يرجى استخدام تنسيق مثل: 1-3, 5, 8-10');
        return;
      }
      const groups = parsed.groups;
      if(groups.length === 0){ showSplitError('صيغة نطاق الصفحات غير صالحة.'); return; }
      // لكل مجموعة أصدر ملف
      for(const [idx,g] of groups.entries()){
        const newPdf = await PDFDocument.create();
        const indices = [];
        for(let p=g.start-1;p<=g.end-1;p++) indices.push(p);
        const copied = await newPdf.copyPages(srcDoc, indices);
        copied.forEach(p=> newPdf.addPage(p));
        const bytes = await newPdf.save();
        const name = (g.start===g.end) ? `page-${g.start}.pdf` : `pages-${g.start}-${g.end}.pdf`;
        zip.file(name, bytes);
        setProgress(Math.round(((idx+1)/groups.length)*90), `إنشاء مجموعة ${idx+1}/${groups.length}`);
      }
      // إذا كانت مجموعة واحدة فقط، قدم الملف مباشرة بدل ZIP
      if(groups.length === 1){
        const g = groups[0];
        const newPdf = await PDFDocument.create();
        const indices = [];
        for(let p=g.start-1;p<=g.end-1;p++) indices.push(p);
        const copied = await newPdf.copyPages(srcDoc, indices);
        copied.forEach(p=> newPdf.addPage(p));
        const newBytes = await newPdf.save();
        const blob = new Blob([newBytes],{type:'application/pdf'});
        createDownloadWidget(blob, (g.start===g.end)? `page-${g.start}.pdf` : `pages-${g.start}-${g.end}.pdf`, splitResult);
        setProgress(100, 'اكتمل التقسيم');
      } else {
        setProgress(95, 'إنشاء الأرشيف (ZIP)...');
        const blob = await zip.generateAsync({ type: 'blob' });
        createDownloadWidget(blob, 'split-outputs.zip', splitResult);
        setProgress(100, 'اكتمل التقسيم');
      }
    }
  }catch(err){ console.error(err); showSplitError('حدث خطأ أثناء التقسيم. حاول مرة أخرى.'); }
  finally{ splitBtn.disabled = false; splitBtn.textContent = 'تقسيم الآن'; }
});

// ------------------ دمج PDF ------------------
mergeFilesInput && mergeFilesInput.addEventListener('change', (e)=>{
  mergeResult.innerHTML = '';
  showMergeError('');
  const files = Array.from(e.target.files || []);
  if(files.length === 0){ mergeFilesInfo.textContent = 'لم يتم اختيار أي ملفات بعد.'; return; }
  mergeFilesInfo.textContent = `عدد الملفات المحددة: ${files.length}`;
});

mergeBtn && mergeBtn.addEventListener('click', async ()=>{
  mergeResult.innerHTML = '';
  showMergeError('');
  const files = Array.from(mergeFilesInput.files || []);
  if(files.length === 0){ showMergeError('الرجاء اختيار ملفات PDF للدمج أولاً.'); return; }
  try{
    mergeBtn.disabled = true; mergeBtn.textContent = 'جاري الدمج ...';
    const newPdf = await PDFDocument.create();
    for(const [i,file] of files.entries()){
      if(file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')){ showMergeError('أحد الملفات ليس بصيغة PDF.'); return; }
      const ab = await file.arrayBuffer();
      const src = await PDFDocument.load(ab);
      const count = src.getPageCount();
      const indices = Array.from({length: count}, (_,i)=>i);
      const copied = await newPdf.copyPages(src, indices);
      copied.forEach(p=> newPdf.addPage(p));
      setProgress(Math.round(((i+1)/files.length)*90), `جارٍ دمج الملف ${i+1}/${files.length}`);
    }
    setProgress(95, 'حفظ الملف النهائي...');
    const bytes = await newPdf.save();
    const blob = new Blob([bytes],{type:'application/pdf'});
    createDownloadWidget(blob, 'merged.pdf', mergeResult);
    setProgress(100, 'اكتمل الدمج');
  }catch(err){ console.error(err); showMergeError('حدث خطأ أثناء الدمج. حاول مرة أخرى.'); }
  finally{ mergeBtn.disabled = false; mergeBtn.textContent = 'دمج الملفات الآن'; }
});

// جاهزية بسيطة
document.addEventListener('DOMContentLoaded',()=>{
  // لا شيء إضافي حاليا
});

// ------------------ PDF -> Word (بسيط باستخدام استخراج نص PDF.js) ------------------
let pdf2wordArrayBuffer = null;
pdf2wordInput && pdf2wordInput.addEventListener('change', async (e)=>{
  pdf2wordResult.innerHTML = '';
  showPdf2WordError('');
  const file = e.target.files && e.target.files[0];
  if(!file){ pdf2wordInfo.textContent = 'لم يتم اختيار ملف بعد.'; pdf2wordArrayBuffer = null; return; }
  if(file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')){ showPdf2WordError('الرجاء اختيار ملف PDF أولاً.'); pdf2wordInput.value=''; return; }
  pdf2wordInfo.textContent = `تم اختيار الملف: ${file.name}`;
  pdf2wordArrayBuffer = await file.arrayBuffer();
});

pdf2wordBtn && pdf2wordBtn.addEventListener('click', async ()=>{
  pdf2wordResult.innerHTML = '';
  showPdf2WordError('');
  if(!pdf2wordArrayBuffer){ showPdf2WordError('الرجاء اختيار ملف PDF أولاً.'); return; }
  if(!window['pdfjsLib']){ showPdf2WordError('مكتبة PDF.js غير متاحة.'); return; }
  try{
    pdf2wordBtn.disabled = true; pdf2wordBtn.textContent = 'جاري التحويل ...';
    const loadingTask = pdfjsLib.getDocument({data: pdf2wordArrayBuffer});
    const pdf = await loadingTask.promise;
    let fullText = '';
    for(let i=1;i<=pdf.numPages;i++){
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(it=>it.str);
      fullText += strings.join(' ') + '\n\n';
      setProgress(Math.round((i/pdf.numPages)*85), `استخراج النص... صفحة ${i}/${pdf.numPages}`);
    }
    // بناء محتوى HTML بسيط لتصديره كملف .doc (Word يفتح ملفات HTML المحفوظة بامتداد .doc)
    const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>Converted</title></head><body><pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(fullText)}</pre></body></html>`;
    const blob = new Blob([html], { type: 'application/msword' });
    createDownloadWidget(blob, 'converted.doc', pdf2wordResult);
    setProgress(100, 'اكتمل التحويل');
  }catch(err){ console.error(err); showPdf2WordError('فشل تحويل PDF إلى Word. قد يحتوي الملف على محتوى معقد.'); }
  finally{ pdf2wordBtn.disabled = false; pdf2wordBtn.textContent = 'تحويل إلى Word'; }
});

function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ------------------ تعديل PDF (حذف/تدوير/إعادة ترتيب) ------------------
let editArrayBuffer = null;
let editSrcDoc = null;
let editPagesState = []; // { origIndex, rotation: 0|90|180|270, kept: true }
let editTextItems = []; // per-page text items from PDF.js: [{str, transform, width, height}, ...]

function renderPagesList(){
  pagesList.innerHTML = '';
  if(!editPagesState || editPagesState.length===0){ pagesList.textContent = 'لا توجد صفحات للعرض.'; return; }
  editPagesState.forEach((p, idx)=>{
    const row = document.createElement('div'); row.className = 'page-row';
    const thumbWrap = document.createElement('div');
    if(p.thumb){
      const img = document.createElement('img'); img.src = p.thumb; img.className = 'thumb-canvas'; thumbWrap.appendChild(img);
    } else {
      const placeholder = document.createElement('div'); placeholder.style.width='110px'; placeholder.style.height='140px'; placeholder.style.border='1px dashed #e6f0f8'; placeholder.style.borderRadius='6px'; placeholder.style.display='flex'; placeholder.style.alignItems='center'; placeholder.style.justifyContent='center'; placeholder.textContent='...'; thumbWrap.appendChild(placeholder);
    }
    const meta = document.createElement('div'); meta.className='meta';
    const title = document.createElement('div'); title.textContent = `الصفحة ${p.origIndex+1}`; title.style.fontWeight='700';
    const info = document.createElement('div'); info.textContent = `الدوران: ${p.rotation}°`; info.style.color='var(--muted)'; info.style.marginTop='6px';
    meta.appendChild(title); meta.appendChild(info);
    const controls = document.createElement('div'); controls.style.display='flex'; controls.style.gap='8px';
    const btnUp = document.createElement('button'); btnUp.textContent='↑'; btnUp.title='نقل للأعلى'; btnUp.onclick = ()=>{ if(idx>0){ [editPagesState[idx-1], editPagesState[idx]] = [editPagesState[idx], editPagesState[idx-1]]; renderPagesList(); } };
    const btnDown = document.createElement('button'); btnDown.textContent='↓'; btnDown.title='نقل للأسفل'; btnDown.onclick = ()=>{ if(idx < editPagesState.length-1){ [editPagesState[idx+1], editPagesState[idx]] = [editPagesState[idx], editPagesState[idx+1]]; renderPagesList(); } };
    const btnRotate = document.createElement('button'); btnRotate.textContent='⤾'; btnRotate.title='تدوير 90°'; btnRotate.onclick = ()=>{ p.rotation = (p.rotation + 90) % 360; renderPagesList(); };
    const btnDelete = document.createElement('button'); btnDelete.textContent='حذف'; btnDelete.title='حذف الصفحة'; btnDelete.onclick = ()=>{ p.kept = !p.kept; renderPagesList(); };
  const btnEditPage = document.createElement('button'); btnEditPage.textContent='تعديل'; btnEditPage.title='فتح محرر الصفحة'; btnEditPage.onclick = ()=>{ openPageEditor(p.origIndex); };
    controls.appendChild(btnUp); controls.appendChild(btnDown); controls.appendChild(btnRotate); controls.appendChild(btnDelete);
  controls.appendChild(btnEditPage);
    if(!p.kept) row.style.opacity='0.45';
    row.appendChild(thumbWrap); row.appendChild(meta); row.appendChild(controls);
    pagesList.appendChild(row);
  });
}

// Render thumbnails using PDF.js and attach to editPagesState[i].thumb as dataURL
async function renderThumbnails(arrayBuffer){
  if(!window['pdfjsLib']) return;
  try{
    const loading = pdfjsLib.getDocument({data: arrayBuffer});
    const pdf = await loading.promise;
    const total = pdf.numPages;
    for(let i=1;i<=total;i++){
      const page = await pdf.getPage(i);
      // collect text items for this page to support find/replace
      try{
        const textContent = await page.getTextContent();
        editTextItems[i-1] = textContent.items.map(it=>({
          str: it.str,
          transform: it.transform, // [a,b,c,d,e,f]
          width: it.width || 0,
          height: it.height || (it.transform? Math.abs(it.transform[3]) : 10),
        }));
      }catch(e){ editTextItems[i-1] = []; }
      const viewport = page.getViewport({ scale: 1 });
      const scale = 110 / viewport.width;
      const scaledViewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(scaledViewport.width);
      canvas.height = Math.round(scaledViewport.height);
      const ctx = canvas.getContext('2d');
      const renderContext = { canvasContext: ctx, viewport: scaledViewport };
      await page.render(renderContext).promise;
      const dataUrl = canvas.toDataURL('image/png');
      if(editPagesState[i-1]) editPagesState[i-1].thumb = dataUrl;
      setProgress(Math.round((i/total)*90), `إنشاء معاينات... ${i}/${total}`);
      // progressively render list so user sees thumbnails as they come
      renderPagesList();
    }
    setProgress(100, 'اكتملت المعاينات');
  }catch(err){ console.warn('thumbnail render failed', err); }
}

editFileInput && editFileInput.addEventListener('change', async (e)=>{
  editResult.innerHTML = '';
  showEditError('');
  const file = e.target.files && e.target.files[0];
  if(!file){ editFileInfo.textContent = 'لم يتم اختيار ملف بعد.'; editArrayBuffer = null; editSrcDoc = null; editPagesState = []; renderPagesList(); return; }
  if(file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')){ showEditError('الرجاء اختيار ملف PDF أولاً.'); editFileInput.value=''; return; }
  try{
    const ab = await file.arrayBuffer(); editArrayBuffer = ab; editSrcDoc = await PDFDocument.load(ab); const cnt = editSrcDoc.getPageCount();
    editPagesState = Array.from({length:cnt}, (_,i)=>({ origIndex: i, rotation: 0, kept: true }));
  editFileInfo.textContent = `تم اختيار الملف: ${file.name} - عدد الصفحات: ${cnt}`;
  renderPagesList();
  // start generating thumbnails asynchronously
  renderThumbnails(ab).catch(e=>console.warn('thumbnails error', e));
  }catch(err){ console.error(err); showEditError('تعذر تحميل الملف للتعديل.'); }
});

applyEditBtn && applyEditBtn.addEventListener('click', async ()=>{
  editResult.innerHTML = ''; showEditError('');
  if(!editArrayBuffer || !editSrcDoc){ showEditError('الرجاء اختيار ملف PDF أولاً.'); return; }
  try{
    applyEditBtn.disabled = true; applyEditBtn.textContent = 'جاري تطبيق التعديلات ...';
    const newPdf = await PDFDocument.create();
    // نعيد إنشاء المستند حسب ترتيب editPagesState مع تطبيق الدوران
    const toProcess = editPagesState.filter(s=>s.kept);
    for(const [i,s] of toProcess.entries()){
      const copied = await newPdf.copyPages(editSrcDoc, [s.origIndex]);
      const p = copied[0];
      newPdf.addPage(p);
      if(s.rotation && s.rotation !== 0){
        try{ p.setRotation(PDFLib.degrees(s.rotation)); }catch(e){ /* ignore */ }
      }
      setProgress(Math.round(((i+1)/toProcess.length)*90), `تطبيق التعديلات... ${i+1}/${toProcess.length}`);
    }
    const bytes = await newPdf.save();
    const blob = new Blob([bytes],{type:'application/pdf'});
    createDownloadWidget(blob, 'edited.pdf', editResult);
    setProgress(100, 'تم إنشاء الملف المعدل');
  }catch(err){ console.error(err); showEditError('فشل تطبيق التعديلات. حاول مرة أخرى.'); }
  finally{ applyEditBtn.disabled = false; applyEditBtn.textContent = 'تطبيق التعديلات وحفظ'; }
});

// ------------------ نص: بحث واستبدال داخل PDF (تقريبي) ------------------
const findInput = document.getElementById('findInput');
const replaceInput = document.getElementById('replaceInput');
const replaceTextBtn = document.getElementById('replaceTextBtn');

// Helper: approximate conversion from PDF.js text transform to pdf-lib coordinates
function pdfjsItemToPdfLibBox(item, pageHeight){
  // item.transform = [a, b, c, d, e, f]
  const t = item.transform || [1,0,0,1,0,0];
  const x = t[4];
  const y = t[5];
  const width = item.width || (item.str.length * (item.height || 10) * 0.5);
  const height = item.height || (Math.abs(t[3]) || 10);
  // pdf-lib origin is bottom-left, pdfjs y is baseline from bottom? We compute y from pageHeight
  const pdfY = pageHeight - y - height; // approximate
  return { x, y: pdfY, width, height };
}

async function replaceTextInPdf(find, replace){
  if(!editArrayBuffer || !editSrcDoc){ showEditError('الرجاء اختيار ملف PDF أولاً.'); return; }
  if(!find){ showEditError('الرجاء إدخال نص البحث.'); return; }
  try{
    replaceTextBtn.disabled = true; replaceTextBtn.textContent = 'جاري الاستبدال ...';
    const newPdf = await PDFDocument.create();
    // ensure source doc loaded
    const src = await PDFDocument.load(editArrayBuffer);
    const pageCount = src.getPageCount();
    let totalReplacements = 0;
    for(let i=0;i<pageCount;i++){
      const copied = await newPdf.copyPages(src, [i]);
      const p = copied[0];
      const page = newPdf.addPage(p);
      const pageHeight = page.getHeight();
      // check collected text items
      const items = editTextItems[i] || [];
      for(const it of items){
        try{
          const textLower = (it.str || '').toLowerCase();
          const findLower = find.toLowerCase();
          if(textLower.includes(findLower)){
            // approximate box
            const box = pdfjsItemToPdfLibBox(it, pageHeight);
            // redact underlying text by drawing white rectangle
            page.drawRectangle({ x: box.x, y: box.y, width: box.width, height: box.height, color: PDFLib.rgb(1,1,1) });
            // draw replacement text
            const fontSize = Math.min( (box.height*0.9)||12, 24 );
            page.drawText(replace, { x: box.x+1, y: box.y + (box.height - fontSize)/2, size: fontSize, color: PDFLib.rgb(0,0,0) });
            totalReplacements++;
          }
        }catch(e){ /* ignore individual item errors */ }
      }
      setProgress(Math.round(((i+1)/pageCount)*90), `معالجة الصفحة ${i+1}/${pageCount}`);
    }
    const bytes = await newPdf.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    createDownloadWidget(blob, 'edited_text.pdf', editResult);
    setProgress(100, `انتهى الاستبدال — ${totalReplacements} عنصر(عناصر) تم استبدالها`);
  }catch(err){ console.error(err); showEditError('حدث خطأ أثناء استبدال النص.'); }
  finally{ replaceTextBtn.disabled = false; replaceTextBtn.textContent = 'استبدال النص'; }
}

if(replaceTextBtn){ replaceTextBtn.addEventListener('click', ()=>{ replaceTextInPdf(findInput.value || '', replaceInput.value || ''); }); }

// ------------------ Page Editor (click-to-edit full-screen) ------------------
let editorState = { currentPageIndex: null, scale: 1, pageHeightPoints: 0 };

async function openPageEditor(pageIndex){
  if(!editArrayBuffer){ showEditError('الرجاء اختيار ملف PDF أولاً.'); return; }
  if(!window['pdfjsLib']){ showEditError('مكتبة PDF.js غير متاحة.'); return; }
  try{
    setProgress(5, 'جاري تجهيز محرر الصفحة...');
    const loading = pdfjsLib.getDocument({ data: editArrayBuffer });
    const pdf = await loading.promise;
    const page = await pdf.getPage(pageIndex+1);
    // page height in PDF points (scale 1)
    const baseViewport = page.getViewport({ scale: 1 });
    const pageHeightPoints = baseViewport.height;
    // choose an editor scale to make text easily clickable (limit width)
    const targetWidth = Math.min(1000, baseViewport.width * 2);
    const scale = Math.max(1, targetWidth / baseViewport.width);
    const viewport = page.getViewport({ scale });

    // setup canvas for crisp rendering on high-DPR displays
    const dpr = window.devicePixelRatio || 1;
    editorCanvas.width = Math.round(viewport.width * dpr);
    editorCanvas.height = Math.round(viewport.height * dpr);
    editorCanvas.style.width = `${viewport.width}px`;
    editorCanvas.style.height = `${viewport.height}px`;
    const ctx = editorCanvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // render page
    await page.render({ canvasContext: ctx, viewport }).promise;

    // build overlays from text items (collected earlier during thumbnails)
    editorOverlays.innerHTML = '';
    const items = editTextItems[pageIndex] || [];
    items.forEach((item, idx)=>{
      try{
        const itemHeight = item.height || Math.abs((item.transform && item.transform[3]) || 10);
        const itemWidth = item.width || (item.str ? item.str.length * (itemHeight * 0.5) : 20);
        const x_px = (item.transform && item.transform[4] ? item.transform[4] * scale : 0);
        const y_px = (item.transform && item.transform[5] ? item.transform[5] * scale : 0);
        // convert to canvas top-left coordinate system
        const top = Math.round(viewport.height - y_px - (itemHeight * scale));
        const left = Math.round(x_px);
        const width_px = Math.max(8, Math.round(itemWidth * scale));
        const height_px = Math.max(8, Math.round(itemHeight * scale));

        const ov = document.createElement('div');
        ov.className = 'overlay';
        ov.style.left = left + 'px';
        ov.style.top = top + 'px';
        ov.style.width = width_px + 'px';
        ov.style.height = height_px + 'px';
        ov.style.lineHeight = (height_px - 4) + 'px';
        ov.style.overflow = 'hidden';
        ov.contentEditable = true;
        ov.spellcheck = false;
        ov.dataset.orig = item.str || '';
        ov.dataset.index = String(idx);
        ov.textContent = item.str || '';
        // allow focusing the editable region on double click (or single click)
        ov.addEventListener('dblclick', (ev)=>{ ev.stopPropagation(); ov.focus(); selectElementText(ov); });
        ov.addEventListener('focus', ()=>{ ov.style.background = 'rgba(255,255,255,0.85)'; ov.style.color = '#000'; });
        ov.addEventListener('blur', ()=>{ ov.style.background = 'transparent'; ov.style.color = 'inherit'; });
        editorOverlays.appendChild(ov);
      }catch(e){ /* ignore individual overlay errors */ }
    });

    editorState = { currentPageIndex: pageIndex, scale, pageHeightPoints };
    pageEditorModal && pageEditorModal.setAttribute('aria-hidden', 'false');
    setProgress(100, 'محرر الصفحة جاهز');
  }catch(err){ console.error('openPageEditor', err); showEditError('فشل فتح محرر الصفحة.'); }
}

function closePageEditor(){
  if(pageEditorModal) pageEditorModal.setAttribute('aria-hidden', 'true');
  if(editorOverlays) editorOverlays.innerHTML = '';
  editorState = { currentPageIndex: null, scale: 1, pageHeightPoints: 0 };
}

// helper to select content of an element
function selectElementText(el){
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
}

// Save edited overlays back into a new PDF (approximate: redact + draw new text)
editorSave && editorSave.addEventListener('click', async ()=>{
  if(editorState.currentPageIndex === null){ showEditError('لا توجد صفحة مفتوحة للمحرر.'); return; }
  try{
    setProgress(5, 'جاري حفظ التعديلات...');
    const src = await PDFDocument.load(editArrayBuffer);
    const newPdf = await PDFDocument.create();
    // embed a standard font for drawing replacements
    const helv = await newPdf.embedFont(PDFLib.StandardFonts.Helvetica);

    // copy all pages first
    const pageCount = src.getPageCount();
    const copiedPages = await newPdf.copyPages(src, Array.from({length: pageCount}, (_,i)=>i));
    copiedPages.forEach(p=> newPdf.addPage(p));

    // process only edited page for now
    const pIndex = editorState.currentPageIndex;
    const overlays = Array.from(editorOverlays.querySelectorAll('.overlay'));
    let changes = 0;
    for(const ov of overlays){
      const orig = ov.dataset.orig || '';
      const now = (ov.textContent || '').trim();
      if(now && now !== orig){
        const itemIdx = parseInt(ov.dataset.index || '0', 10);
        const items = editTextItems[pIndex] || [];
        const item = items[itemIdx];
        if(!item) continue;
        // compute PDF-lib box using page height in points
        const box = pdfjsItemToPdfLibBox(item, editorState.pageHeightPoints);
        try{
          const page = newPdf.getPage(pIndex);
          // redact original
          page.drawRectangle({ x: box.x, y: box.y, width: box.width, height: box.height, color: PDFLib.rgb(1,1,1) });
          const fontSize = Math.min((box.height*0.9)||12, 28);
          page.drawText(now, { x: box.x + 1, y: box.y + (box.height - fontSize)/2, size: fontSize, font: helv, color: PDFLib.rgb(0,0,0) });
          changes++;
        }catch(e){ console.warn('apply overlay failed', e); }
      }
    }

    const bytes = await newPdf.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    createDownloadWidget(blob, 'page-edited.pdf', editResult);
    setProgress(100, `تم الحفظ — ${changes} تعديل(ت) تم تطبيقها`);
    closePageEditor();
  }catch(err){ console.error('editorSave', err); showEditError('فشل حفظ التعديلات إلى ملف PDF.'); }
});

editorClose && editorClose.addEventListener('click', ()=>{ closePageEditor(); });

// close editor on Escape
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && pageEditorModal && pageEditorModal.getAttribute('aria-hidden') === 'false'){ closePageEditor(); } });

// ------------------ صور -> PDF ------------------
imgFilesInput && imgFilesInput.addEventListener('change', (e)=>{
  img2pdfResult.innerHTML = '';
  showImg2PdfError('');
  const files = Array.from(e.target.files || []);
  if(files.length === 0){ imgFilesInfo.textContent = 'لم يتم اختيار صور بعد.'; return; }
  imgFilesInfo.textContent = `عدد الصور: ${files.length}`;
});

img2pdfBtn && img2pdfBtn.addEventListener('click', async ()=>{
  img2pdfResult.innerHTML = ''; showImg2PdfError('');
  const files = Array.from(imgFilesInput.files || []);
  if(files.length === 0){ showImg2PdfError('الرجاء اختيار صور أولاً.'); return; }
  try{
    img2pdfBtn.disabled = true; img2pdfBtn.textContent = 'جاري التحويل ...';
    const newPdf = await PDFDocument.create();
    for(const [i,file] of files.entries()){
      const ab = await file.arrayBuffer();
      const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
      let embedded;
      if(isPng) embedded = await newPdf.embedPng(ab); else embedded = await newPdf.embedJpg(ab);
      const { width, height } = embedded.scale(1);
      const page = newPdf.addPage([width, height]);
      page.drawImage(embedded, { x:0, y:0, width, height });
      setProgress(Math.round(((i+1)/files.length)*90), `تحويل الصور... ${i+1}/${files.length}`);
    }
    setProgress(95, 'حفظ ملف PDF...');
    const bytes = await newPdf.save();
    const blob = new Blob([bytes],{type:'application/pdf'});
    createDownloadWidget(blob, 'images.pdf', img2pdfResult);
    setProgress(100, 'اكتمل تحويل الصور');
  }catch(err){ console.error(err); showImg2PdfError('فشل تحويل الصور إلى PDF. تحقق من أنواع الملفات وحجمها.'); }
  finally{ img2pdfBtn.disabled = false; img2pdfBtn.textContent = 'تحويل الصور إلى PDF'; }
});
