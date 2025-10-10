import React, { useState } from 'react';
import './DescriptionBox.css';

const DescriptionBox = () => {
  const [activeTab, setActiveTab] = useState('description');
  const [reviews, setReviews] = useState([
    { id: 1, name: "Alice Johnson", rating: 5, text: "Absolutely love this! High quality, perfect fit, and super stylish.", avatar: "https://i.pravatar.cc/50?img=1" },
    { id: 2, name: "Bob Smith", rating: 4, text: "Good product overall, slightly smaller than expected, but comfortable.", avatar: "https://i.pravatar.cc/50?img=2" },
  ]);

  const [newReview, setNewReview] = useState({ name: '', rating: 0, text: '', avatar: '' });
  const [hoverRating, setHoverRating] = useState(0); // For hover effect

  const handleSubmit = (e) => {
    e.preventDefault();
    if(newReview.name && newReview.text && newReview.rating > 0){
      const reviewToAdd = {
        id: reviews.length + 1,
        ...newReview,
        avatar: `https://i.pravatar.cc/50?u=${newReview.name}`
      };
      setReviews([reviewToAdd, ...reviews]);
      setNewReview({ name: '', rating: 0, text: '', avatar: '' });
      setHoverRating(0);
    }
  };

  return (
    <div className='descriptionbox'>
      {/* Navigator Tabs */}
      <div className="descriptionbox-navigator">
        <div 
          className={`descriptionbox-nav-box ${activeTab === 'description' ? 'active' : 'fade'}`}
          onClick={() => setActiveTab('description')}
        >
          Description
        </div>
        <div 
          className={`descriptionbox-nav-box ${activeTab === 'reviews' ? 'active' : 'fade'}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews ({reviews.length})
        </div>
      </div>

      <div className="descriptionbox-description">
        {activeTab === 'description' ? (
          <p>
            I absolutely love this product! From the moment I unboxed it, I could tell that the quality is top-notch. The materials feel durable yet soft, making it incredibly comfortable to wear all day long. The fit is true to size, and the design is modern and versatile — perfect for both casual outings and semi-formal occasions.

The stitching and finish are impeccable, showing attention to detail. I also appreciate the thoughtful color options and subtle branding, which adds a touch of elegance without being over the top.

Another plus is the practicality — it has enough storage space for daily essentials, and the structure maintains its shape even after extended use. Overall, this product combines style, comfort, and functionality flawlessly. Highly recommended for anyone looking to elevate their wardrobe with a reliable and chic item!
          </p>
        ) : (
          <div className="reviews-section">
            {/* Write a review form */}
            <form className="write-review" onSubmit={handleSubmit}>
              <input 
                type="text" 
                placeholder="Your name" 
                value={newReview.name} 
                onChange={e => setNewReview({...newReview, name: e.target.value})} 
                required
              />
              <div className="star-rating">
                {[1,2,3,4,5].map(star => (
                  <span 
                    key={star} 
                    className={`star ${star <= (hoverRating || newReview.rating) ? 'filled' : ''}`}
                    onClick={() => setNewReview({...newReview, rating: star})}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    ★
                  </span>
                ))}
              </div>
              <textarea 
                placeholder="Write your review..." 
                value={newReview.text} 
                onChange={e => setNewReview({...newReview, text: e.target.value})} 
                required
              ></textarea>
              <button type="submit">Submit Review</button>
            </form>

            {/* Display reviews */}
            {reviews.map(review => (
              <div key={review.id} className="review-card">
                <img className="review-avatar" src={review.avatar} alt={review.name} />
                <div className="review-content">
                  <div className="review-header">
                    <span className="reviewer-name">{review.name}</span>
                    <span className="review-rating">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  </div>
                  <p className="review-text">{review.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DescriptionBox;
