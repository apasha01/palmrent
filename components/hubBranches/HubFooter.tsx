
import Image from "next/image"

export default function HubFooter() {
  return (

      <div className="px-2 sm:px-0">
        {/* Section 1: Online Reservation Steps */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            مراحل رزرو آنلاین اجاره خودرو در پالم رنت
          </h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            روند رزرو باید ساده باشد. در هاب اجاره خودرو، مراحل عمومی به این شکل است:
          </p>
          <ul className="space-y-2 text-muted-foreground leading-relaxed">
            <li>
              <span className="font-bold text-foreground">۱) انتخاب شهر:</span> ابتدا شهر مقصد را انتخاب کنید (مثلاً دبی، استانبول، عمان و سایر شهرهای فعال).
            </li>
            <li>
              <span className="font-bold text-foreground">۲) انتخاب تاریخ و ساعت:</span> زمان تحویل و عودت را مشخص کنید تا موجودی و قیمت دقیق‌تر نمایش داده شود.
            </li>
            <li>
              <span className="font-bold text-foreground">۳) مقایسه خودروها:</span> خودروها را از نظر قیمت، کلاس، ویژگی‌ها و شرایط (مثل بدون ودیعه/پرداخت در محل) بررسی کنید.
            </li>
            <li>
              <span className="font-bold text-foreground">۴) ثبت درخواست رزرو:</span> اطلاعات لازم را وارد کنید و رزرو را نهایی کنید.
            </li>
            <li>
              <span className="font-bold text-foreground">۵) هماهنگی تحویل:</span> تیم پشتیبانی برای هماهنگی محل تحویل و جزئیات لازم با شما در ارتباط خواهد بود.
            </li>
          </ul>
        </section>




     <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Fast Online Reservation */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="relative w-full h-48">
              <Image
                src="/images/fast-booking.jpg"
                alt="رزرو آنلاین و سریع"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="font-bold text-foreground mb-3">رزرو آنلاین و سریع</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                با موتور جستجوی پالم رنت، شهر و تاریخ را مشخص می‌کنید و خودروها را بر اساس قیمت، کلاس خودرو و شرایط قابل انتخاب مقایسه می‌کنید. هدف ما این است که مسیر رزرو پیچیده نشود و کاربر به‌جای فرم‌های طولانی، سریع به نتیجه برسد.
              </p>
            </div>
          </div>

          {/* Card 2: Delivery at Location */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="relative w-full h-48">
              <Image
                src="/images/car-delivery.jpg"
                alt="تحویل در محل"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="font-bold text-foreground mb-3">تحویل در محل (اختیاری)</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                بسته به شهر و شرایط رزرو، تحویل خودرو می‌تواند در فرودگاه، هتل، محل اقامت یا شعبه انجام شود. جزئیات تحویل و عودت (لوکیشن و ساعت) در مرحله‌ی نهایی رزرو و هماهنگی پشتیبانی مشخص و قطعی می‌شود.
              </p>
            </div>
          </div>

          {/* Card 3: Support and Coordination */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="relative w-full h-48">
              <Image
                src="/images/support-team.jpg"
                alt="پشتیبانی و هماهنگی"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="font-bold text-foreground mb-3">پشتیبانی و هماهنگی</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                پشتیبانی خوب یعنی رزرو فقط یک شماره پیگیری نیست. از لحظه ثبت درخواست تا تحویل و عودت، تیم پالم رنت تلاش می‌کند هماهنگی‌ها روشن باشد؛ زمان‌بندی، محل تحویل، قوانین خودرو و پاسخ به سوالات پرتکرار.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Delivery and Return */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            تحویل و عودت خودرو (فرودگاه، هتل یا شعبه)
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            یکی از مهم‌ترین بخش‌های تجربه اجاره خودرو، تحویل و عودت بدون دردسر است. در پالم رنت تلاش می‌شود فرآیند تحویل روشن باشد؛ خودرو در محل توافق‌شده تحویل می‌شود، وضعیت ظاهری و جزئیات اولیه بررسی می‌شود و سپس قرارداد نهایی می‌گردد. برای عودت هم بهتر است زمان را دقیق برنامه‌ریزی کنید، چون تأخیر ممکن است هزینه اضافه ایجاد کند. اگر مقصد شما فرودگاه است، بهتر است شماره پرواز و زمان تقریبی رسیدن/پرواز برگشت را از قبل در اختیار تیم هماهنگی قرار دهید تا تحویل دقیق‌تر انجام شود.
          </p>
        </section>

        {/* Section 4: No Deposit */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            اجاره خودرو بدون ودیعه یعنی چه؟
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            «بدون ودیعه» یعنی برای بعضی رزروها، نیازی به پرداخت مبلغ ضمانت (Deposit) در زمان تحویل خودرو نیست. این موضوع می‌تواند برای مسافرانی که نمی‌خواهند مبلغی از کارت‌شان بلوکه شود یا ترجیح می‌دهند هزینه‌ها را ساده‌تر مدیریت کنند، گزینه‌ای بسیار جذابی باشد. با این حال، بدون ودیعه بودن معمولاً به چند عامل وابسته است: شهر، کلاس خودرو، مدت اجاره، تاریخ سفر، سوابق رزرو و شرایط تامین‌کننده. به همین دلیل، در پالم رنت ممکن است در یک شهر برای بعضی خودروها «بدون ودیعه» فعال باشد و برای برخی دیگر فعال نباشد.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <span className="font-bold text-foreground">نکته مهم</span> این است که نبود ودیعه به معنی نبود مسئولیت نیست. همان‌طور که در هر اجاره خودرو رایج است، مسئولیت‌های مرتبط با خسارت، جریمه‌ها یا هزینه‌های خارج از قرارداد (در صورت وقوع) طبق قوانین همان شهر/شرکت اجاره‌دهنده محاسبه می‌شود. پیشنهاد ما این است که قبل از نهایی کردن رزرو، شرایط خودرو را در صفحه شهر و کارت خودرو بررسی کنید و اگر سوالی دارید، همان جا از پشتیبانی راهنمایی بگیرید.
          </p>
        </section>

        {/* Section 5: Payment on Delivery */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            پرداخت در محل چگونه انجام می‌شود؟
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            «پرداخت در محل» به این معنی است که شما مبلغ اجاره (یا بخشی از آن) را هنگام تحویل خودرو پرداخت می‌کنید. این گزینه برای بسیاری از کاربران حس امنیت بیشتری ایجاد می‌کند، چون پرداخت نهایی را بعد از مشاهده خودرو و تکمیل فرآیند تحویل انجام می‌دهند. با توجه به قوانین هر شهر و روش‌های پرداخت رایج (نقدی/کارت/لینک پرداخت)، جزئیات پرداخت در محل ممکن است متفاوت باشد. بنابراین بهتر است هنگام رزرو، روش پرداخت و وضعیت آن را در اطلاعات رزرو مشاهده کنید.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <span className="font-bold text-foreground">پیشنهاد کاربردی:</span> اگر زمان تحویل شما در ساعات شلوغ فرودگاه یا ساعات پایانی شب است، بهتر است از قبل روش پرداخت را مشخص کنید تا تحویل سریع‌تر انجام شود. پالم رنت سعی می‌کند در هماهنگی‌های تحویل، این موارد شفاف و قابل پیش‌بینی باشد.
          </p>
        </section>

        {/* Section 6: Price Calculation */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            قیمت اجاره خودرو چگونه محاسبه می‌شود؟
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            قیمت اجاره خودرو به‌صورت مستقیم به چند عامل اصلی وابسته است: کلاس خودرو (اقتصادی، سدان، SUV، لوکس)، مدت اجاره، تاریخ‌های انتخابی (فصل‌های پرتقاضا معمولاً گران‌تر هستند)، شرایط بیمه، محدودیت‌های کیلومتر (در صورت وجود) و خدماتی مثل تحویل در فرودگاه/هتل. در پالم رنت شما می‌توانید با تغییر تاریخ یا انتخاب کلاس اقتصادی‌تر، گزینه‌های مقرون‌به‌صرفه‌تری پیدا کنید؛ همچنین مقایسه چند خودرو در یک شهر کمک می‌کند تصمیم دقیق‌تری بگیرید.
          </p>
        </section>

        {/* Section 7: About Palm Rent */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            اجاره خودرو با پالم رنت
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            اگر دنبال یک راه مطمئن برای جابه‌جایی در سفر هستید، اجاره خودرو معمولاً بهترین انتخاب است؛ آزادی کامل در برنامه‌ریزی، حذف وابستگی به تاکسی و حمل‌ونقل عمومی، و امکان رفت‌وآمد راحت بین نقاط مختلف شهر. <span className="font-bold text-foreground">صفحه‌ی هاب اجاره خودرو</span> در پالم رنت برای همین ساخته شده؛ تا قبل از ورود به صفحات شهرها، یک تصویر شفاف از شرایط، مراحل رزرو، قیمت‌گذاری، مدارک لازم و نکات مهم داشته باشید و با خیال راحت وارد انتخاب شهر و خودرو شوید.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            در پالم رنت، تمرکز اصلی روی تجربه ساده و قابل‌اعتماد است؛ شما ابتدا شهر را انتخاب می‌کنید، تاریخ و ساعت تحویل/عودت را مشخص می‌کنید، سپس خودروها را مقایسه می‌کنید و رزرو را ثبت می‌کنید. بعد از ثبت، تیم پشتیبانی مراحل هماهنگی تحویل را انجام می‌دهد. بعضی مزایا مثل <span className="font-bold text-foreground">پرداخت در محل</span> یا <span className="font-bold text-foreground">بدون ودیعه</span> ممکن است بسته به شهر، خودرو، تاریخ و شرایط رزرو متفاوت باشد؛ بنابراین در ادامه، همه چیز را «عمومی و شفاف» توضیح می‌دهیم و برای جزئیات دقیق، شما را به صفحه‌ی شهر مربوط هدایت می‌کنیم.
          </p>
        </section>


      </div>

  )
}
