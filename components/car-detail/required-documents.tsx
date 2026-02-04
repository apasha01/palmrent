/* eslint-disable @typescript-eslint/no-explicit-any */
import { FileCheck, FileText, CreditCard, Camera, Info } from 'lucide-react'

const documentsIran = [
  { icon: FileText, label: 'پاسپورت' },
  { icon: FileCheck, label: 'گواهینامه رانندگی بین‌المللی' },
  { icon: Camera, label: 'عکس بلیت (در صورت تحویل در فرودگاه)' },
]

const documentsUAE = [
  { icon: CreditCard, label: 'ویزا قابل:', value: null },
  { icon: FileText, label: 'امارات آیدی' },
  { icon: FileCheck, label: 'گواهینامه امارات' },
  { icon: Camera, label: 'عکس بلیت (در صورت تحویل در فرودگاه)' },
]

export function RequiredDocuments(branch:any) {
  return (
    <div className=" ">
      <h3 className="text-gray-900 font-semibold mb-4">مدارک مورد نیاز برای اجاره کیا سلتوس در دبی</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border rounded-lg p-4">
        {/* For Iran Residents */}
        <div>
          <h4 className=" font-medium mb-3 flex items-center gap-2">
            <span className="w-2 h-2  rounded-full"></span>
            برای افراد مقیم ایران
          </h4>
          <ul className="space-y-2">
            {documentsIran.map((doc, index) => (
              <li key={index} className="flex items-center gap-2 text-gray-600 text-sm">
                <doc.icon className="w-4 h-4 text-gray-400" />
                <span>{doc.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* For UAE Residents */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <span className="w-2 h-2  rounded-full"></span>
            برای افراد مقیم امارات
          </h4>
          <ul className="space-y-2">
            {documentsUAE.map((doc, index) => (
              <li key={index} className="flex items-center gap-2 text-gray-600 text-sm">
                <doc.icon className="w-4 h-4 text-gray-400" />
                <span>{doc.label}</span>
              </li>
            ))}
          </ul>
        </div>

              <p className="text-gray-500 text-xs  flex gap-2 items-center">
                <Info width={12} height={12}/>
        مدارک معتبر است با ملیت‌ها و ویزا همراه داشته باشید.
      </p>
      </div>


    </div>
  )
}
