var mongoose = require('mongoose');  
var eventsSchema = new mongoose.Schema({  
  event: String,
  start_date: Number,
  end_date: Number,
  posts: [
        {
            id: String,
            message: String,
            comments: Number
        }
      ]
});
mongoose.model('Events', eventsSchema);