دليل وضع الإعلانات في مشروع "مدير PDF"

تم تجهيز أماكن إعلانية (placeholders) في الصفحة لتسهيل دمج وحدات إعلانية لاحقًا (مثل Google AdSense أو شبكات إعلانية أخرى). هذا الدليل يشرح خطوات الدمج والنقاط التي يجب مراعاتها.

1) المواضع المعدة
- أعلى الأداة: عنصر `div.ad-slot.ad-top` (ممتد فوق الأداة الرئيسية).
- داخل الأداة (منتصف): عنصر `div.ad-slot.ad-middle`.
- أسفل الأداة: عنصر `div.ad-slot.ad-bottom`.
- داخل المقالة: عنصر `div.ad-slot.ad-in-article`.

كل عنصر يحتوي على `data-ad-position` يحدد موضع الإعلان (top, middle, bottom, article).

2) إضافة Google AdSense (مثال)
- قم بإضافة سكربت AdSense داخل `<head>` مرة واحدة مع استبدال `ca-pub-XXXXXXXXXXXX` بمعرف حسابك:

  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXX" crossorigin="anonymous"></script>

- ثم ضع وحدة الإعلان داخل المكان المرغوب، مثلاً داخل `div.ad-slot.ad-top`:

  <ins class="adsbygoogle"
       style="display:block"
       data-ad-client="ca-pub-XXXXXXXXXXXX"
       data-ad-slot="YYYYYYYYYYY"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>

ملاحظة: لا تضع أكثر من وحدة إعلان مكررة بنفس `data-ad-slot` في الصفحة.

3) تنسيقات مقترحة
- استخدم وحدات متجاوبة (`data-ad-format="auto"`) لتبدو جيدة على الجوال.
- حافظ على مسافات بين الإعلانات والمحتوى، ولا تضع إعلانات تغطي المحتوى.

4) سياسات وخصوصية
- تأكد من الالتزام بسياسات شبكة الإعلانات التي تستخدمها (GDPR، سياسة المحتوى، الخ).
- أضف سياسة خصوصية في موقعك توضح أنك تستخدم خدمات إعلانية إن لزم.

5) نصائح تقنية
- عند اختبار محليًا عبر `file://` بعض وحدات الإعلانات قد لا تعمل. اختبر عبر استضافة ثابتة (GitHub Pages أو Netlify) أو باستخدم خادم محلي بسيط.
- إن أردت إظهار مُعاملات تعتمد على عرض/نقر، استخدم أدوات التحليل (Google Analytics) مع مراعاة الخصوصية.

6) إزالة العناصر الوهمية
- العناصر الحالية هي عناصر حجز بصري (placeholders). استبدل محتوى `div.ad-placeholder` أو أدخل كود الإعلانات داخل `div.ad-slot` مباشرة.

إذا تحب، أستطيع:
- إضافة أمثلة جاهزة لكل موضع داخل HTML (مُعلّقة / مغلّفة بتعليق) لتسهيل النسخ واللصق.
- إضافة زر "تفعيل وضع الإعلان التجريبي" لعرض نموذج إعلاني محلي أثناء التطوير.

أخبرني كيف تفضل أن أدمج وحدات الإعلانات (Google AdSense أو شبكة أخرى) وسأدرج الكود الأمثل مع الإرشادات اللازمة.

---

إضافات عملية لإثبات الملكية (AdSense) وملف ads.txt

1) مقتطف AdSense (ضعه داخل `<head>` عند النشر - المثال هنا يستخدم المعرف المزوَّد):

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2108027030250763"
  crossorigin="anonymous"></script>
```

ملاحظة: في هذا المشروع تم إدراج مقتطف AdSense داخل `index.html` كتعليق حتى لا يتم تحميل وحدات الإعلانات أثناء التطوير المحلي. لإظهاره فعليًا احذف علامات التعليق حوله.

2) ملف ads.txt

ضع ملف `ads.txt` في جذر موقعك (مثال: `https://example.com/ads.txt`) بالمحتوى التالي:

```
google.com, pub-2108027030250763, DIRECT, f08c47fec0942fa0
```

3) علامة وصفية للتحقق

بعض أدوات التحقق تطلب وسم ميتا في `<head>`، مثال:

```html
<meta name="google-site-verification" content="PUT_VERIFICATION_CODE_HERE">
```

استبدل القيمة بما يزودك به Google Search Console أو أداة التحقق المطلوبة.

4) معاينة محلية

للاختبار المحلي دون تفعيل إعلانات حقيقية، استخدم زر "معاينة إعلان" الموجود في رأس الصفحة — سيعرض عنصرًا تجريبيًا داخل أماكن الحجز المصممة (`.ad-placeholder`).

إذا رغبت أدرج لك أيضًا ملفًا `ads.txt`، شيفرة الميتا في `index.html` بشكل مُفعّل، أو أضفت زر لعرض/اختبار كود AdSense مباشرة، أخبرني أي خيار تفضّل.

---

ملاحظة حول وحدات إعلانية مخفية (Hidden ad units)

لقد أضفت داخل `index.html` وحدات إعلانية مخفية مسبقًا (`ins.adsbygoogle`) في جميع مواضع الحجز (top, middle, bottom, in-article). هذه الوحدات موجودة لتسهيل تفعيل الإعلانات لاحقًا دون تعديل كبير في الهيكل. خطوات التفعيل:

- افتح `index.html` وابحث عن `ins.adsbygoogle` داخل العنصر `div.ad-placeholder` للموضع الذي تريد تفعيله.
- غيّر قيمة `data-ad-slot="SLOT_ID"` إلى قيمة الـ slot الحقيقية التي يعطيك إياها AdSense.
- أزل `style="display:none"` أو غيرها إلى `style="display:block"` لكي تصبح الوحدة مرئية.
- تأكد من تحميل سكربت AdSense في `<head>` وأن `data-ad-client` يحتوي على `ca-pub-...` الصحيح.

إذا تفضل، أستطيع برمجيًا إضافة زر في واجهة الإدارة يسمح لك بلصق معرف slot أو تفعيل/إخفاء الوحدات بدون تحرير الملف يدويًا.