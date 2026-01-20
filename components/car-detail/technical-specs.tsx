const specs = [
  { label: 'عنوان', value: 'جیپاک' },
  { label: 'کلاس خودرو:', value: 'سدان' },
  { label: 'سال:', value: '۲۰۲۳' },
  { label: 'گیربکس:', value: 'اتوماتیک' },
  { label: 'سوخت:', value: 'بنزین' },
  { label: 'ظرفیت نفرات:', value: '۵ نفر' },
  { label: 'ظرفیت چمدان:', value: '۳ چمدان' },
  { label: 'تعداد درب:', value: '۴ درب' },
  { label: 'حجم موتور:', value: '۱۵۰۰' },
]

export function TechnicalSpecs() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-4">مشخصات فنی</h2>
      
      <div className="grid grid-cols-2 gap-x-8 gap-y-1">
        {specs.map((spec, index) => (
          <div key={index} className="flex items-center justify-between py-2.5 border-b border-gray-100">
            <span className="text-gray-500 text-sm">{spec.label}</span>
            <span className="text-gray-900 text-sm font-medium">{spec.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
