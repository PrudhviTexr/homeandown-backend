import React from 'react';
import { Link } from 'react-router-dom';

const BecomeAgent: React.FC = () => {
  return (
    <section className="py-16 bg-[#162e5a] text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="rounded-2xl border border-white/10 bg-[#0ca5e9] shadow-xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300">
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">
              Become a Real Estate Agent
            </h2>
            <p className="text-white">
              Join our team with the best companies around the world
            </p>
          </div>
          <Link
            to="/agents"
            className="bg-[#162e5a] hover:bg-[#0b91cc] text-white px-6 py-3 rounded-full font-semibold shadow-md hover:shadow-lg transition-all"
            onClick={() =>
              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100)
            }
          >
            Enquire Now
          </Link>
        </div>
      </div>
    </section>

  );
};

export default BecomeAgent;