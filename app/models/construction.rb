class Construction < ActiveRecord::Base
  attr_accessible :comment, :name, :state

  def as_json _
    {comment: comment, name: name, state: state}
  end
end
