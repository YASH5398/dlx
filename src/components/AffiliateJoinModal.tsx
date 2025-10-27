import React from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/badge';
import { 
  Star, 
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckCircle,
  Gift,
  Crown,
  Sparkles
} from 'lucide-react';

interface AffiliateJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: () => void;
  isFirstTime?: boolean;
}

export default function AffiliateJoinModal({ isOpen, onClose, onJoin, isFirstTime = false }: AffiliateJoinModalProps) {
  const benefits = [
    {
      icon: DollarSign,
      title: "Earn 30-40% Commission",
      description: "Get paid for every successful referral"
    },
    {
      icon: Users,
      title: "Build Your Network",
      description: "Grow your income through referrals"
    },
    {
      icon: TrendingUp,
      title: "Passive Income",
      description: "Earn while you sleep"
    },
    {
      icon: Crown,
      title: "Exclusive Benefits",
      description: "Access to partner-only features"
    }
  ];

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full">
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {isFirstTime ? "Welcome to DLX!" : "Join Our Affiliate Program"}
              </CardTitle>
              <CardDescription className="text-lg text-slate-600 dark:text-slate-400">
                {isFirstTime 
                  ? "Start earning with our Affiliate Partner Program!" 
                  : "Earn 30-40% commission on every referral"
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Commission Rate Display */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                    30-40%
                  </div>
                  <div className="text-lg text-slate-700 dark:text-slate-300 font-medium">
                    Commission Rate
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Based on your current rank
                  </div>
                </div>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white mb-1">
                        {benefit.title}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {benefit.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Features List */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>No upfront costs or fees</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Real-time tracking and analytics</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Weekly commission payouts</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Dedicated partner support</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={onJoin}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Gift className="w-5 h-5 mr-2" />
                  Join Affiliate Program
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 px-6 rounded-lg"
                >
                  Maybe Later
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span>Trusted by 10,000+ partners worldwide</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
