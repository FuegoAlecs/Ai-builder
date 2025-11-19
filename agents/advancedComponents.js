/**
 * Advanced Component Templates - Hero Sections, Features, Pricing, Testimonials, etc.
 * These are production-ready, beautiful components with multiple variants
 */

/**
 * Generate Hero Section - Variant 1: Gradient with Image
 */
export function generateHeroGradient(designSystem, content = {}) {
  const primaryColor = designSystem.colors?.primary || '#3B82F6';
  const secondaryColor = designSystem.colors?.secondary || '#8B5CF6';
  
  return `import { ArrowRight, Play } from 'lucide-react';

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[${primaryColor}] via-[${secondaryColor}] to-purple-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-lg rounded-full text-white/90 text-sm font-medium mb-8 animate-slideDown">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          New: AI-Powered Features
        </div>

        {/* Main heading */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 animate-fadeIn">
          Build Amazing
          <span className="block bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
            Websites Faster
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-12 leading-relaxed animate-slideUp">
          Create stunning, production-ready websites in minutes with our AI-powered platform. 
          No coding required.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <button className="group inline-flex items-center gap-2 bg-white text-[${primaryColor}] px-8 py-4 rounded-xl font-semibold text-lg hover:scale-105 hover:shadow-2xl transition-all duration-300">
            Get Started Free
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
          </button>
          <button className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all duration-300 border border-white/20">
            <Play size={20} />
            Watch Demo
          </button>
        </div>

        {/* Social proof */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-white/60 text-sm animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/40" />
              ))}
            </div>
            <span>10,000+ happy users</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-300">★★★★★</span>
            <span>4.9/5 rating</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
`;
}

/**
 * Generate Feature Grid - 3 Column Layout
 */
export function generateFeatureGrid(designSystem) {
  const primaryColor = designSystem.colors?.primary || '#3B82F6';
  
  return `import { Zap, Shield, Sparkles, Rocket, Heart, TrendingUp } from 'lucide-react';

function Features() {
  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built for speed with optimized performance and instant loading times.',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: Shield,
      title: 'Secure by Default',
      description: 'Enterprise-grade security with automatic updates and monitoring.',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      icon: Sparkles,
      title: 'AI-Powered',
      description: 'Intelligent features that learn and adapt to your needs.',
      color: 'from-purple-400 to-pink-500'
    },
    {
      icon: Rocket,
      title: 'Easy to Scale',
      description: 'Grow from startup to enterprise without changing platforms.',
      color: 'from-green-400 to-emerald-500'
    },
    {
      icon: Heart,
      title: 'User Friendly',
      description: 'Intuitive interface designed for both beginners and experts.',
      color: 'from-red-400 to-rose-500'
    },
    {
      icon: TrendingUp,
      title: 'Analytics Built-in',
      description: 'Track performance with detailed insights and reports.',
      color: 'from-indigo-400 to-purple-500'
    }
  ];

  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Everything you need to
            <span className="block bg-gradient-to-r from-[${primaryColor}] to-purple-600 bg-clip-text text-transparent">
              build amazing products
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features that help you create, launch, and grow your business faster than ever before.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              style={{ animationDelay: \`\${index * 0.1}s\` }}
            >
              {/* Icon */}
              <div className={\`w-16 h-16 rounded-2xl bg-gradient-to-br \${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300\`}>
                <feature.icon className="text-white" size={32} />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover arrow */}
              <div className="mt-4 text-[${primaryColor}] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Learn more →
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
`;
}

/**
 * Generate Pricing Table - 3 Tiers
 */
export function generatePricingTable(designSystem) {
  const primaryColor = designSystem.colors?.primary || '#3B82F6';
  
  return `import { Check, Zap } from 'lucide-react';

function Pricing() {
  const plans = [
    {
      name: 'Starter',
      price: '29',
      description: 'Perfect for individuals and small projects',
      features: [
        '5 Projects',
        '10GB Storage',
        'Basic Support',
        'Core Features',
        'Monthly Updates'
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: '79',
      description: 'Best for growing teams and businesses',
      features: [
        'Unlimited Projects',
        '100GB Storage',
        'Priority Support',
        'Advanced Features',
        'Daily Updates',
        'Custom Integrations',
        'Analytics Dashboard'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: '199',
      description: 'For large organizations with custom needs',
      features: [
        'Everything in Pro',
        'Unlimited Storage',
        '24/7 Dedicated Support',
        'Custom Features',
        'SLA Guarantee',
        'Advanced Security',
        'White Label',
        'API Access'
      ],
      popular: false
    }
  ];

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your needs. Always know what you'll pay.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={\`relative bg-white rounded-2xl p-8 transition-all duration-300 \${
                plan.popular
                  ? 'border-2 border-[${primaryColor}] shadow-2xl scale-105'
                  : 'border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-1'
              }\`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-[${primaryColor}] to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Zap size={14} />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan name */}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <p className="text-gray-600 mb-6">
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">
                  \${plan.price}
                </span>
                <span className="text-gray-600">/month</span>
              </div>

              {/* CTA Button */}
              <button
                className={\`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 \${
                  plan.popular
                    ? 'bg-gradient-to-r from-[${primaryColor}] to-purple-600 text-white hover:shadow-lg hover:scale-105'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }\`}
              >
                Get Started
              </button>

              {/* Features list */}
              <ul className="mt-8 space-y-4">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Need a custom plan? <a href="/contact" className="text-[${primaryColor}] font-semibold hover:underline">Contact us</a>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Pricing;
`;
}
