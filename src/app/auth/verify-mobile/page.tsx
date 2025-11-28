'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyMobileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    if (!userId || !email) {
      router.push('/partner/signup-success');
      return;
    }
    if (!codeSent) {
      handleResend();
    }
  }, []);

  const handleResend = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch('/api/auth/resend-verification-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email }),
      });

      const data = await response.json();

      if (response.ok) {
        setCodeSent(true);
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.error || 'Failed to send verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newCode = pastedData.split('').concat(['', '', '', '', '']).slice(0, 6);
    setCode(newCode);
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: verificationCode }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect based on user role
        if (data.user?.role === 'CUSTOMER') {
          // Customers are activated immediately, redirect to signin
          router.push(`/auth/signin?verified=true&message=verification_complete`);
        } else {
          // Partners need admin approval, redirect to signup success
          router.push(`/partner/signup-success?verified=true`);
        }
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-.923-2.256-1.016-3.798-2.295-4.203-2.682-.528-.51-.395-.779.15-1.382.197-.252.28-.37.525-.631.244-.26.326-.396.499-.646.173-.252.231-.42.346-.68.115-.26.058-.481-.015-.68-.073-.198-.638-1.54-.874-2.111-.229-.58-.457-.49-.594-.507-.136-.015-.297-.009-.455-.009-.156 0-.407.058-.622.282-.214.224-.817.797-.817 1.945 0 1.147.847 2.26.964 2.581.117.326.165 2.074.386 3.05.204.938.593 1.884.998 2.54.59.966 1.34 1.802 2.301 2.656.908.793 1.98 1.47 3.139 2.009.939.429 1.778.733 2.712.956 1.213.288 2.371.247 3.45.166.558-.041 2.546-.516 2.904-1.007.36-.493.259-1.145.172-1.588-.083-.436-.373-2.044-.514-2.796-.04-.246-.08-.509-.083-.682-.003-.173.05-.358.18-.505.13-.146.297-.21.495-.297.197-.087 1.46-.68 1.673-.888.212-.21.35-.44.277-.775-.073-.335-.463-1.024-.636-1.382-.173-.358-.037-.555.098-.732.134-.178.298-.429.447-.643.15-.214.199-.358.299-.694.099-.337.05-.72-.025-1.011-.074-.289-.291-.437-.593-.601-.303-.164-.641-.259-.797-.163-.156.098-1.068.697-1.228.841-.16.144-.132.34-.01.585.122.246.521 1.069.593 1.451.072.382.176.649-.01.845-.186.197-.443.167-.856-.175-.412-.34-1.782-1.068-2.487-1.401-.705-.333-.953-.416-.882-.77.071-.355.705-.42.882-.342.177.08.776.259 1.144.367.368.108.645.035.826-.017.18-.052.808-.514.995-.663.186-.15.314-.088.382.024.068.111.295.388.138.796-.157.408-.733 2.353-.835 2.674-.102.321-.204.685-.271.809-.068.123-.139.24-.102.398.037.157.126.479.379.743.252.263.501.346.676.416.174.07.347.343.347.733 0 .39-.173.927-.401 1.494-.228.567-.395.8-.231 1.102.163.302.581.807.654 1.07.073.263.127.767-.081 1.193-.208.426-.636.837-1.121 1.102-.485.265-1.056.574-1.494.751-.438.177-.783.287-1.056.335-.273.048-.636.085-1.077.085-.44 0-.905-.048-1.293-.143-.389-.095-.705-.226-1.008-.417-.304-.191-.555-.454-.822-.844-.267-.39-.455-.819-.596-1.193-.14-.375-.252-.848-.363-1.317-.11-.469-.212-.891-.359-1.249-.147-.358-.353-.7-.543-.953-.19-.252-.398-.416-.543-.514-.145-.099-.29-.149-.29-.286s.145-.388.29-.545c.145-.158.398-.445.633-.678.236-.234.422-.434.543-.553.12-.118.216-.268.312-.535.096-.267.163-.64.304-1.058.14-.419.31-.773.488-1.019.178-.245.384-.403.495-.515.111-.111.186-.19.363-.457.177-.267.375-.602.543-.793.168-.191.298-.354.298-.55s-.073-.392-.111-.535c-.038-.143-.089-.298-.062-.416.027-.119.108-.31.177-.524.069-.214.152-.545.255-.752.103-.207.246-.496.375-.643.129-.146.304-.349.471-.471.167-.123.352-.265.471-.381.119-.116.17-.227.17-.39s-.051-.273-.196-.471c-.145-.198-.345-.418-.506-.55-.161-.132-.362-.256-.489-.343-.128-.086-.2-.12-.246-.132-.047-.012-.089-.023-.127-.023-.038 0-.067-.008-.122-.023-.055-.015-.156-.041-.314-.098-.158-.057-.368-.146-.591-.25-.223-.104-.485-.232-.744-.38-.259-.147-.533-.324-.776-.498-.244-.174-.486-.365-.662-.497-.176-.132-.305-.24-.382-.34-.077-.1-.103-.172-.103-.264s.049-.299.103-.415c.054-.116.156-.298.356-.499.2-.201.516-.444.745-.589.229-.145.419-.25.556-.31.137-.06.24-.093.24-.17s-.103-.205-.137-.3c-.034-.095-.1-.247-.155-.38-.055-.133-.112-.275-.195-.38-.083-.105-.248-.318-.415-.486-.167-.168-.382-.386-.636-.593-.254-.207-.581-.445-.85-.607-.269-.162-.54-.335-.824-.471-.284-.136-.632-.26-.966-.357-.334-.097-.755-.179-1.047-.221-.292-.042-.523-.06-.692-.06-.169 0-.305.027-.471.047-.166.02-.367.051-.593.063-.226.012-.493.009-.714-.012-.221-.021-.427-.065-.671-.065-.244 0-.565.044-.798.079-.233.035-.505.111-.74.158-.235.047-.556.133-.774.187-.218.054-.526.179-.83.235-.304.056-.775.042-1.031.037-.256-.005-.56-.017-.838-.037-.278-.02-.569-.056-.797-.056-.228 0-.456.036-.671.07-.215.034-.435.1-.689.141-.254.041-.577.1-.839.181-.262.081-.573.218-.877.343-.304.125-.682.305-1.011.435-.329.13-.727.315-1.056.47-.329.155-.698.326-1.014.488-.316.162-.634.374-.949.537-.315.163-.707.326-1.105.448-.398.122-.903.218-1.323.236-.42.018-1.012-.012-1.593.091-.581.103-1.273.37-1.795.58-.522.21-1.052.508-1.639.715-.587.207-1.264.398-1.892.552-.628.154-1.372.315-2.006.397-.634.082-1.254.166-1.815.237-.561.071-1.134.132-1.665.172-.531.04-1.104.072-1.633.085-.529.013-1.094-.015-1.623.012-.529.027-1.098.093-1.637.109-.539.016-1.108-.015-1.641-.012-.533.003-1.094.051-1.623.062-.529.011-1.094-.034-1.623-.091-.529-.057-1.098-.145-1.637-.21-.539-.065-1.108-.139-1.641-.21-.533-.071-1.098-.142-1.623-.154-.525-.012-1.094.007-1.623.049-.529.042-1.098.133-1.637.158-.539.025-1.108-.01-1.641-.037-.533-.027-1.098-.083-1.623-.103-.525-.02-1.094-.048-1.623-.062-.529-.014-1.098-.048-1.637-.072-.539-.024-1.108-.096-1.641-.133-.533-.037-1.098-.145-1.623-.186-.525-.041-1.094-.161-1.623-.21-.529-.049-1.098-.258-1.637-.342-.539-.084-1.108-.279-1.641-.414-.533-.135-1.098-.387-1.623-.553-.525-.166-1.094-.487-1.623-.808-.529-.321-1.098-.751-1.637-1.219-.539-.468-1.108-1.079-1.641-1.756-.533-.677-1.098-1.495-1.623-2.471-.525-.976-1.094-2.127-1.623-3.497-.529-1.37-1.098-2.88-1.637-4.717-.539-1.837-1.108-3.917-1.641-6.301-.533-2.384-1.098-4.968-1.623-7.817-.525-2.849-1.094-5.969-1.623-9.318-.529-3.349-1.098-6.907-1.637-10.575-.539-3.668-1.108-7.541-1.641-11.43-.533-3.889-1.098-7.949-1.623-11.949-.525-4-1.094-8.008-1.623-11.92-.529-3.912-1.098-7.73-1.637-11.361-.539-3.631-1.108-7.078-1.641-10.339-.533-3.261-1.098-6.341-1.623-9.137-.525-2.796-1.094-5.316-1.623-7.558-.529-2.242-1.098-4.213-1.637-5.899-.539-1.686-1.108-3.101-1.641-4.245-.533-1.144-1.098-2.022-1.623-2.638-.525-.616-1.094-.985-1.623-1.111-.529-.126-1.098-.147-1.637-.126-.539.021-1.108.056-1.641.063-.533.007-1.098-.015-1.623.021-.525.036-1.094.117-1.623.162-.529.045-1.098.125-1.637.147-.539.022-1.108.019-1.641.019-.533 0-1.098-.038-1.623-.063-.525-.025-1.094-.096-1.623-.147-.529-.051-1.098-.14-1.637-.203-.539-.063-1.108-.137-1.641-.186-.533-.049-1.098-.115-1.623-.147-.525-.032-1.094-.066-1.623-.08-.529-.014-1.098-.028-1.637-.032-.539-.004-1.108-.003-1.641.005-.533.008-1.098.023-1.623.037-.525.014-1.094.025-1.623.034-.529.009-1.098.011-1.637.011-.539 0-1.108-.007-1.641-.012-.533-.005-1.098-.015-1.623-.018-.525-.003-1.094-.005-1.623-.005-.529 0-1.098.002-1.637.003-.539.001-1.108.003-1.641.004-.533.001-1.098.002-1.623.001-.525-.001-1.094-.003-1.623-.003-.529 0-1.098.001-1.637 0-.539-.001-1.108-.002-1.641-.001-.533.001-1.098.003-1.623.004-.525.001-1.094 0-1.623-.001-.529-.001-1.098-.002-1.637-.001-.539.001-1.108.002-1.641.002-.533 0-1.098-.001-1.623-.002-.525-.001-1.094 0-1.623 0-.529 0-1.098.001-1.637 0-.539-.001-1.108-.001-1.641-.001-.533 0-1.098 0-1.623 0-.525 0-1.094 0-1.623 0-.529 0-1.098 0-1.637 0-.539 0-1.108 0-1.641 0-.533 0-1.098 0-1.623 0-.525 0-1.094 0-1.623 0-.529 0M17.472 14.382" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Mobile</h1>
          <p className="text-gray-600">
            We've sent a 6-digit verification code via WhatsApp
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Enter verification code
            </label>
            <div className="flex gap-2" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleVerify}
            disabled={isLoading || code.join('').length !== 6}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify Mobile'}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={isLoading || resendCooldown > 0}
              className="text-green-600 font-semibold hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyMobile() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyMobileContent />
    </Suspense>
  );
}
