'use client';
import Link from 'next/link';
import { Star } from 'lucide-react';

export default function PartnerPage() {
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
                href="/" 
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                For Customers
              </Link>
              <Link 
                href="/auth/signin?type=partner"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Partner Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Grow Your Business with</span>
            <span className="block text-blue-600">Local Customer Loyalty</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Join our network of successful local businesses. Create meaningful connections with your customers through personalized rewards programs.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link
                href="/auth/register/partner"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                Become a Partner
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link
                href="#learn-more"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="learn-more" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Partner With LocalPerks
            </h2>
            <p className="mt-4 text-xl text-gray-500">
              Join our network of successful local businesses
            </p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
              {/* For Partners */}
              <div className="bg-blue-50 p-8 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Getting Started</h3>
                <ul className="space-y-4 text-gray-600">
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-blue-600 mr-2">1.</span>
                    Sign up as a LocalPerks partner
                  </li>
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-blue-600 mr-2">2.</span>
                    Customize your rewards program
                  </li>
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-blue-600 mr-2">3.</span>
                    Set your points structure and rewards
                  </li>
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-blue-600 mr-2">4.</span>
                    Start rewarding your customers
                  </li>
                </ul>
              </div>

              {/* Features */}
              <div className="bg-green-50 p-8 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Platform Features</h3>
                <ul className="space-y-4 text-gray-600">
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-green-600 mr-2">✓</span>
                    Easy-to-use dashboard
                  </li>
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-green-600 mr-2">✓</span>
                    Customer analytics and insights
                  </li>
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-green-600 mr-2">✓</span>
                    Customizable rewards tiers
                  </li>
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-green-600 mr-2">✓</span>
                    Marketing tools and support
                  </li>
                </ul>
              </div>

              {/* Benefits */}
              <div className="bg-purple-50 p-8 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Partner Benefits</h3>
                <ul className="space-y-4 text-gray-600">
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-purple-600 mr-2">↗</span>
                    Increased customer retention
                  </li>
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-purple-600 mr-2">↗</span>
                    Higher average purchase value
                  </li>
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-purple-600 mr-2">↗</span>
                    Data-driven business decisions
                  </li>
                  <li className="flex items-start">
                    <span className="h-6 w-6 text-purple-600 mr-2">↗</span>
                    Community of local businesses
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50">
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