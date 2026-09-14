/**
 * فرمت‌بندی قیمت به ریال ایران
 * @param {number|string} amount - مقدار مبلغ به ریال
 * @param {string} lang - کد زبان فعال ('fa' یا 'en')
 * @returns {string} - رشته فرمت‌شده با نماد مناسب
 */
export const formatPrice = (amount, lang = 'fa') => {
  const num = Number(amount) || 0;
  
  if (lang === 'fa') {
    // فرمت‌بندی استاندارد فارسی با نماد ریال
    return `${num.toLocaleString('fa-IR')} ریال`;
  }
  
  // فرمت‌بندی استاندارد انگلیسی با نماد IRR
  return `${num.toLocaleString('en-US')} IRR`;
};

/**
 * فرمت‌بندی اعداد معمولی با جداکننده ارقام
 * @param {number|string} num
 * @param {string} lang
 * @returns {string}
 */
export const formatNumber = (num, lang = 'fa') => {
  const parsed = Number(num) || 0;
  return lang === 'fa' ? parsed.toLocaleString('fa-IR') : parsed.toLocaleString('en-US');
};
