class Construction < ActiveRecord::Base
  attr_accessible :comment, :name, :state

  def as_json _
    { id: name, comment: comment, state: state }
   end
end
