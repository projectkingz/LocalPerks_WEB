import Link from 'next/link';
import { Star, Gift, Sparkles, MapPin } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Star className="h-6 w-6 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">LocalPerks</span>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/partner" 
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                For Businesses
              </Link>
              <Link 
                href="/auth/signin"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Earn Rewards at Your</span>
            <span className="block text-blue-600">Favorite Local Spots</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            One rewards program, countless local favorites. Earn points and rewards when you spend in your community.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
                              <Link
                  href="/auth/signin"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                >
                  Join Free Today
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link
                href="#featured-rewards"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                View Rewards
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <div id="featured-rewards" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Rewards You'll Love
            </h2>
            <p className="mt-4 text-xl text-gray-500">
              Support local businesses and get rewarded
            </p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
              {/* How It Works */}
              <div className="bg-blue-50 p-8 rounded-xl">
                <div className="flex items-center mb-4">
                  <MapPin className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-xl font-bold text-gray-900">How It Works</h3>
                </div>
                <ul className="space-y-4 text-gray-600">
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-blue-600 mr-2">1.</span>
                    Sign up for free in seconds
                  </li>
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-blue-600 mr-2">2.</span>
                    Shop at local partner businesses
                  </li>
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-blue-600 mr-2">3.</span>
                    Earn points on every purchase
                  </li>
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-blue-600 mr-2">4.</span>
                    Redeem for amazing rewards
                  </li>
                </ul>
              </div>

              {/* Popular Rewards */}
              <div className="bg-green-50 p-8 rounded-xl">
                <div className="flex items-center mb-4">
                  <Gift className="h-6 w-6 text-green-600 mr-2" />
                  <h3 className="text-xl font-bold text-gray-900">Popular Rewards</h3>
                </div>
                <ul className="space-y-4 text-gray-600">
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-green-600 mr-2">✓</span>
                    Free coffee and treats
                  </li>
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-green-600 mr-2">✓</span>
                    Restaurant discounts
                  </li>
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-green-600 mr-2">✓</span>
                    Retail store credits
                  </li>
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-green-600 mr-2">✓</span>
                    Exclusive local experiences
                  </li>
                </ul>
              </div>

              {/* Member Benefits */}
              <div className="bg-purple-50 p-8 rounded-xl">
                <div className="flex items-center mb-4">
                  <Sparkles className="h-6 w-6 text-purple-600 mr-2" />
                  <h3 className="text-xl font-bold text-gray-900">Member Benefits</h3>
                </div>
                <ul className="space-y-4 text-gray-600">
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-purple-600 mr-2">★</span>
                    One card for all rewards
                  </li>
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-purple-600 mr-2">★</span>
                    Special birthday rewards
                  </li>
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-purple-600 mr-2">★</span>
                    Member-only events
                  </li>
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-purple-600 mr-2">★</span>
                    Early access to deals
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Partners Banner */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Popular Categories</h2>
            <div className="mt-8 flex justify-center space-x-8">
              <div className="text-blue-600 font-medium">Restaurants</div>
              <div className="text-blue-600 font-medium">Cafes</div>
              <div className="text-blue-600 font-medium">Retail</div>
              <div className="text-blue-600 font-medium">Services</div>
              <div className="text-blue-600 font-medium">Entertainment</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Star className="h-6 w-6 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">LocalPerks</span>
            </div>
            <p className="text-gray-500">© 2024 LocalPerks. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 